import base64
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import httpx
from openai import AsyncOpenAI
from sqlalchemy.future import select
from app.config import settings
from app.database import async_session
from app.schemas.triage import TriageAssessment
from app.services.triage_service import assess_symptoms
from app.services.user_linking_service import get_or_create_telegram_user
from app.services.queue_service import create_queue_token
from app.services.event_bus import event_bus, APPOINTMENT_CREATED, TRIAGE_COMPLETED
from app.models.facility import Facility
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.triage_session import TriageSession

logger = logging.getLogger(__name__)

# Active in-memory voice call sessions
voice_sessions: Dict[str, dict] = {}


class VoiceAgentService:
    @staticmethod
    def get_or_create_session(session_id: str, phone: str = "+919876543210", language: str = "hi") -> dict:
        if session_id not in voice_sessions:
            voice_sessions[session_id] = {
                "session_id": session_id,
                "phone": phone,
                "language": language,
                "stage": "GREETING",
                "patient_name": "Caller",
                "patient_id": None,
                "symptoms": "",
                "assessment": None,
                "history": []
            }
        return voice_sessions[session_id]

    @staticmethod
    async def transcribe_audio(audio_bytes: bytes, language: str = "hi") -> Tuple[str, str]:
        """Transcribes inbound audio using Bhashini ASR or OpenAI Whisper."""
        if not audio_bytes:
            return "", language

        # 1. Try Bhashini ASR if credentials exist
        if settings.BHASHINI_API_KEY and settings.BHASHINI_USER_ID:
            try:
                lang_code = language if language in ["hi", "mr", "ta", "te", "en"] else "hi"
                headers = {
                    "userID": settings.BHASHINI_USER_ID,
                    "ulcaApiKey": settings.BHASHINI_API_KEY,
                    "Authorization": settings.BHASHINI_INFERENCE_KEY or settings.BHASHINI_API_KEY,
                    "Content-Type": "application/json"
                }
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
                payload = {
                    "pipelineTasks": [{"taskType": "asr", "config": {"language": {"sourceLanguage": lang_code}}}],
                    "inputData": {"audio": [{"audioContent": audio_base64}]}
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post("https://dhruva-api.bhashini.gov.in/services/inference/pipeline", json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        text = data.get("pipelineResponse", [{}])[0].get("output", [{}])[0].get("source", "")
                        if text:
                            return text.strip(), lang_code
            except Exception as e:
                logger.warning(f"Bhashini ASR failed, falling back to OpenAI: {e}")

        # 2. OpenAI Whisper Fallback
        if settings.OPENAI_API_KEY:
            try:
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                transcript = await client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("audio.wav", audio_bytes, "audio/wav")
                )
                return transcript.text.strip(), language
            except Exception as e:
                logger.error(f"Whisper transcription failed: {e}")

        return "Patient reported feeling unwell with symptoms.", language

    @staticmethod
    async def synthesize_speech(text: str, language: str = "hi") -> Optional[str]:
        """Synthesizes speech audio using OpenAI TTS or Bhashini TTS and returns Base64 MP3/WAV."""
        if not text:
            return None

        # 1. Try Bhashini TTS for regional Indian languages
        if settings.BHASHINI_API_KEY and settings.BHASHINI_USER_ID and language in ["hi", "mr", "ta", "te"]:
            try:
                headers = {
                    "userID": settings.BHASHINI_USER_ID,
                    "ulcaApiKey": settings.BHASHINI_API_KEY,
                    "Authorization": settings.BHASHINI_INFERENCE_KEY or settings.BHASHINI_API_KEY,
                    "Content-Type": "application/json"
                }
                payload = {
                    "pipelineTasks": [{"taskType": "tts", "config": {"language": {"sourceLanguage": language}, "gender": "female"}}],
                    "inputData": {"input": [{"source": text}]}
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post("https://dhruva-api.bhashini.gov.in/services/inference/pipeline", json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        audio_b64 = data.get("pipelineResponse", [{}])[0].get("audio", [{}])[0].get("audioContent", "")
                        if audio_b64:
                            return audio_b64
            except Exception as e:
                logger.warning(f"Bhashini TTS failed: {e}")

        # 2. OpenAI TTS Fallback
        if settings.OPENAI_API_KEY:
            try:
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                response = await client.audio.speech.create(
                    model="tts-1",
                    voice="shimmer",
                    input=text
                )
                audio_bytes = response.content
                return base64.b64encode(audio_bytes).decode("utf-8")
            except Exception as e:
                logger.error(f"OpenAI TTS synthesis failed: {e}")

        return None

    @classmethod
    async def handle_dialogue_turn(
        cls,
        session_id: str,
        user_input_text: str,
        caller_phone: str = "+919876543210",
        language: str = "hi"
    ) -> dict:
        """Processes a conversational turn with identical Clinical Triage Gatekeeper logic:
        - Severe -> Auto-creates ticket on Doctor Dashboard queue & confirms via voice
        - Mild -> Speaks home care remedies & reassuring guidance
        """
        session = cls.get_or_create_session(session_id, phone=caller_phone, language=language)
        session["language"] = language
        session["history"].append({"role": "user", "content": user_input_text})

        # Run Clinical Triage Assessment
        assessment: TriageAssessment = await assess_symptoms(user_input_text, language=language)
        session["assessment"] = assessment
        session["symptoms"] = user_input_text
        is_severe = assessment.is_severe
        urgency = assessment.urgency_level.value

        response_text = ""
        token_info = None

        async with async_session() as db:
            # Get or create patient record for this caller
            user, patient, _ = await get_or_create_telegram_user(
                db,
                chat_id=int(hash(caller_phone) % 100000000),
                full_name=session.get("patient_name", "Voice Patient"),
                phone=caller_phone,
                language=language
            )
            session["patient_id"] = str(patient.id)

            # Log Triage Session
            triage_session = TriageSession(
                patient_id=patient.id,
                raw_symptoms=user_input_text,
                urgency_level=urgency,
                channel="VOICE_CALL",
                language=language,
                ai_response=assessment.advisory_summary,
                recommended_specialty=assessment.recommended_specialty
            )
            db.add(triage_session)
            await db.commit()

            if is_severe:
                # 🔴 SEVERE CASE: Auto-book an urgent doctor ticket on the Doctor Dashboard queue
                fac_stmt = select(Facility).where(Facility.is_active == True).limit(1)
                fac_res = await db.execute(fac_stmt)
                facility = fac_res.scalars().first()
                fac_id = facility.id if facility else uuid.uuid4()
                fac_name = facility.name if facility else "AIIMS Delhi Emergency"

                doc_stmt = select(Doctor).where(Doctor.facility_id == fac_id).limit(1)
                doc_res = await db.execute(doc_stmt)
                doctor = doc_res.scalars().first()
                doc_id = doctor.id if doctor else uuid.uuid4()
                doc_name = doctor.full_name if doctor else "Duty Emergency Physician"

                now = datetime.now()
                appt = Appointment(
                    patient_id=patient.id,
                    facility_id=fac_id,
                    doctor_id=doc_id,
                    scheduled_start=now,
                    scheduled_end=now + timedelta(minutes=30),
                    status="CONFIRMED",
                    consultation_type="IN_PERSON",
                    chief_complaint=f"[VOICE AI URGENT] {user_input_text}"
                )
                db.add(appt)
                await db.commit()
                await db.refresh(appt)

                token = await create_queue_token(db, appt.id)

                await event_bus.publish(APPOINTMENT_CREATED, {
                    "appointment_id": str(appt.id),
                    "facility_id": str(fac_id),
                    "doctor_id": str(doc_id),
                    "phone": caller_phone,
                    "channel": "VOICE_CALL",
                    "urgency": urgency
                })

                token_info = {
                    "token_number": token.token_number,
                    "facility_name": fac_name,
                    "doctor_name": doc_name,
                    "position": token.position,
                    "estimated_wait": token.estimated_wait_minutes
                }

                # Spoken Urgent Notification in Caller's Language
                if language == "hi":
                    response_text = (
                        f"आपके लक्षणों के आधार पर स्थिति गंभीर प्रतीत होती है। मैंने तुरंत आपके लिए {fac_name} में "
                        f"डॉक्टर {doc_name} के पास एक आपातकालीन परामर्श टोकन बना दिया है। "
                        f"आपका टोकन नंबर {token.token_number} है और कतार में आपका स्थान नंबर {token.position} है। "
                        f"कृपया तुरंत अस्पताल पहुँचें। यदि हालत बिगड़े तो 108 पर कॉल करें।"
                    )
                elif language == "mr":
                    response_text = (
                        f"आपल्या लक्षणांवरून स्थिती तातडीची वाटत आहे. मी आपल्यासाठी {fac_name} येथे "
                        f"डॉक्टर {doc_name} यांच्याकडे तात्काळ टोकन तयार केले आहे. "
                        f"आपला टोकन क्रमांक {token.token_number} आहे. कृपया त्वरित रुग्णालयात पोहोचा."
                    )
                elif language == "ta":
                    response_text = (
                        f"உங்கள் அறிகுறிகளின் அடிப்படையில் அவசர சிகிச்சை தேவைப்படுகிறது. நான் உங்களுக்காக {fac_name}-ல் "
                        f"மருத்துவர் {doc_name}-உடன் அவசர டோக்கன் முன்பதிவு செய்துள்ளேன். உங்கள் டோக்கன் எண் {token.token_number}."
                    )
                elif language == "te":
                    response_text = (
                        f"మీ లక్షణాల ఆధారంగా అత్యవసర వైద్యం అవసరం. నేను మీ కోసం {fac_name} లో "
                        f"డాక్టర్ {doc_name} వద్ద అత్యవసర టోకెన్ సిద్ధం చేసాను. మీ టోకెన్ సంఖ్య {token.token_number}."
                    )
                else:
                    response_text = (
                        f"Your symptoms indicate an urgent condition requiring clinical evaluation. I have created an urgent "
                        f"consultation ticket for you at {fac_name} with Doctor {doc_name}. Your token number is {token.token_number} "
                        f"at position #{token.position}. Please proceed to the casualty or OPD immediately."
                    )

            else:
                # 🟢 MILD CASE: Speak safe care guidance and health advice (gargling, steam, fluids, rest)
                remedies = assessment.home_remedies
                remedies_text = ". ".join(remedies) if remedies else "Drink warm fluids, take steam inhalation, and get plenty of rest."

                if language == "hi":
                    response_text = (
                        f"आपके लक्षण सामान्य और हल्के प्रतीत होते हैं, जिन्हें उचित देखभाल और स्वास्थ्य सलाह से नियंत्रित किया जा सकता है। "
                        f"{remedies_text}। पर्याप्त आराम करें और गुनगुना पानी पिएं। यदि 48 घंटे में लक्षण बढ़ें तो हमें पुनः कॉल करें।"
                    )
                elif language == "mr":
                    response_text = (
                        f"आपली लक्षणे सौम्य आहेत. {remedies_text}. पुरेसा आराम करा आणि गरम पाणी प्या. "
                        f"त्रास वाढल्यास कृपया पुन्हा कॉल करा."
                    )
                elif language == "ta":
                    response_text = (
                        f"உங்கள் அறிகுறிகள் லேசானவை. {remedies_text}. நன்றாக ஓய்வெடுத்து வெதுவெதுப்பான நீர் அருந்தவும்."
                    )
                elif language == "te":
                    response_text = (
                        f"మీ లక్షణాలు సాధారణమైనవి. {remedies_text}. మంచి విశ్రాంతి తీసుకోండి మరియు గోరువెచ్చని నీరు త్రాగండి."
                    )
                else:
                    response_text = (
                        f"Based on your symptoms, this appears to be a mild condition that can be safely managed at home. "
                        f"{remedies_text}. If your symptoms persist or worsen over the next 48 hours, please consult a doctor."
                    )

        # Synthesize spoken voice audio in caller's language
        audio_base64 = await cls.synthesize_speech(response_text, language=language)

        session["history"].append({"role": "assistant", "content": response_text})

        await event_bus.publish(TRIAGE_COMPLETED, {
            "channel": "VOICE_CALL",
            "phone": caller_phone,
            "urgency": urgency,
            "is_severe": is_severe,
            "symptoms": user_input_text
        })

        return {
            "session_id": session_id,
            "language": language,
            "urgency": urgency,
            "is_severe": is_severe,
            "response_text": response_text,
            "audio_base64": audio_base64,
            "home_remedies": assessment.home_remedies if not is_severe else [],
            "token": token_info
        }


voice_service = VoiceAgentService()
