import re
import logging
from app.config import settings
from app.schemas.triage import TriageAssessment, UrgencyLevel

logger = logging.getLogger(__name__)

TRIAGE_SYSTEM_PROMPT = """You are an AI Clinical Triage Gatekeeper assistant for healthcare.
Your role is to assess symptom urgency, distinguish between SEVERE (Emergency/Urgent) and MILD (Routine/Self-care) conditions, and provide safe actionable advice.
NEVER diagnose diseases conclusively. NEVER prescribe prescription-only medicines.

Rules:
1. Output structured JSON matching the TriageAssessment schema.
2. If red flags exist (severe chest pain, difficulty breathing, stroke symptoms, uncontrolled bleeding, severe burns, loss of consciousness), set urgency_level to EMERGENCY and is_severe to true.
3. If high acuity (high persistent fever, acute abdomen, serious infection, severe trauma), set urgency_level to URGENT and is_severe to true.
4. If MILD or common symptoms (mild cold, sore throat, headache, fatigue, indigestion, rash, backache), set urgency_level to ROUTINE and is_severe to false.
5. For MILD/ROUTINE cases: You MUST provide 3-4 custom, condition-specific home care remedies in the `home_remedies` field tailored EXACTLY to the patient's specific symptoms (e.g. for headache: dark quiet room, cold/warm compress, hydration, screen break; for stomach ache: ginger/mint tea, light bland diet, ORS, warm compress; for cough/cold: warm saline gargle, steam, warm fluids).
6. Translate advisory_summary, next_steps, and home_remedies into the target language requested ({language}).
"""

RED_FLAG_PATTERNS = [
    # English
    r"chest pain", r"crushing chest", r"heart attack",
    r"difficulty breathing", r"can't breathe", r"suffocating", r"shortness of breath",
    r"stroke", r"facial droop", r"slurred speech", r"sudden numbness",
    r"severe bleeding", r"uncontrolled bleeding",
    r"unconscious", r"loss of consciousness", r"passed out", r"fainted",
    r"seizure", r"convulsion", r"fits",
    r"suicidal", r"want to die", r"kill myself", r"end my life",
    r"severe allergic reaction", r"anaphylaxis", r"swelling throat",
    r"poisoning", r"overdose", r"severe burns", r"high fever", r"vomiting blood",
    
    # Hindi
    r"सीने में दर्द", r"छाती में दर्द", r"सांस लेने में तकलीफ", r"सांस फूलना", r"सांस नहीं आ रही",
    r"बेहोश", r"चक्कर खाकर गिरना", r"खून की उल्टी", r"दौरा", r"दिल का दौरा", r"हार्ट अटैक",
    r"बहुत तेज बुखार", r"गंभीर दर्द", r"अत्यधिक रक्तस्राव",
    
    # Marathi
    r"छातीत दुखणे", r"छातीत तीव्र वेदना", r"श्वास घेण्यास त्रास", r"दम लागणे",
    r"बेशुद्ध", r"रक्ताची उलटी", r"हार्ट अटॅक", r"तीव्र वेदना", r"खूप ताप",
    
    # Tamil
    r"நெஞ்சு வலி", r"மூச்சுத் திணறல்", r"மயக்கம்", r"மாரடைப்பு", r"மூச்சு விட சிரமம்",
    r"கடுமையான வலி", r"இரத்த வாந்தி", r"அதிக காய்ச்சல்",
    
    # Telugu
    r"ఛాతీ నొప్పి", r"గుండె నొప్పి", r"శ్వాస ఆడకపోవడం", r"స్పృహ తప్పడం",
    r"తీవ్రమైన నొప్పి", r"రక్తం వాంతి", r"తీవ్ర జ్వరం", r"గుండెపోటు"
]

SYMPTOM_REMEDIES = {
    "headache": {
        "specialty": "General Medicine",
        "keywords": [
            "headache", "head pain", "head ache", "migraine", "temple pain", "throbbing head", "heavy head",
            "सिर दर्द", "सिरदर्द", "सर दर्द", "माथा दर्द", "माइग्रेन",
            "डोकेदुखी", "डोके दुखणे", "माथा दुखणे",
            "தலைவலி", "தலை வலி", "ஒற்றைத் தலைவலி",
            "తలనొప్పి", "తల నొప్పి", "పార్శ్వపు నొప్పి"
        ],
        "advisory": {
            "en": "Your symptoms indicate a common headache or tension-related discomfort. Initial rest, hydration, and screen relief are recommended.",
            "hi": "आपके लक्षण सामान्य सिरदर्द या तनाव-संबंधी परेशानी का संकेत देते हैं। आराम, पानी पीना और स्क्रीन से दूरी बनाना लाभकारी होगा।",
            "mr": "आपली लक्षणे सामान्य डोकेदुखी किंवा तणावाशी संबंधित वाटतात. विश्रांती, पुरेसे पाणी पिणे आणि स्क्रीनपासून दूर राहणे फायदेशीर ठरेल.",
            "ta": "உங்கள் அறிகுறிகள் பொதுவான தலைவலி அல்லது மன அழுத்த அசௌகரியத்தைக் குறிக்கின்றன. ஓய்வு மற்றும் நீர்ச்சத்து நன்மை தரும்.",
            "te": "మీ లక్షణాలు సాధారణ తలనొప్పి లేదా ఒత్తిడిని సూచిస్తున్నాయి. విశ్రాంతి తీసుకోవడం మరియు మంచిగా నీరు త్రాగడం మంచిది."
        },
        "remedies": {
            "en": [
                "Rest in a quiet, dark, well-ventilated room with your eyes closed.",
                "Apply a cool or warm damp compress across your forehead and temples.",
                "Drink plenty of water (dehydration is one of the most common causes of headaches).",
                "Take a complete break from digital screens (mobile/laptop) and dim bright lighting.",
                "Gently massage your temples, forehead, neck, and shoulders to release muscle tension."
            ],
            "hi": [
                "शांत, अंधेरे और हवादार कमरे में आंखें बंद करके आराम करें।",
                "माथे और कनपटियों पर ठंडे या गुनगुने पानी की पट्टी रखें।",
                "पर्याप्त मात्रा में पानी पिएं (पानी की कमी अक्सर सिरदर्द का मुख्य कारण होती है)।",
                "मोबाइल और कंप्यूटर स्क्रीन से दूरी बनाएं और तेज रोशनी से बचें।",
                "तनाव दूर करने के लिए सिर, गर्दन और कंधों की हल्की मालिश करें।"
            ],
            "mr": [
                "शांत, अंधाऱ्या आणि हवेशीर खोलीत डोळे मिटून विश्रांती घ्या.",
                "कपाळावर आणि मानेवर थंड किंवा कोमट पाण्याची पट्टी ठेवा.",
                "पुरेसे पाणी प्या (पाण्याची कमतरता डोकेदुखीचे मुख्य कारण असू शकते).",
                "मोबाईल/स्क्रीनपासून दूर राहा आणि तेजस्वी प्रकाश टाळा.",
                "स्नायूंचा ताण कमी करण्यासाठी मान आणि डोक्याची हलकी मालिश करा."
            ],
            "ta": [
                "அமைதியான, வெளிச்சம் குறைவான அறையில் கண்களை மூடி ஓய்வெடுக்கவும்.",
                "நெற்றி மற்றும் கழுத்து பகுதியில் குளிர்ந்த அல்லது வெதுவெதுப்பான துணி ஒத்தடம் கொடுக்கவும்.",
                "அதிகளவு தண்ணீர் குடிக்கவும் (உடலில் நீர்ச்சத்து குறைவு தலைவலியை உண்டாக்கும்).",
                "மொபைல்/கணினி திரைகளைப் பார்ப்பதைத் தவிர்த்து கண்களுக்கு ஓய்வளிக்கவும்.",
                "மன அழுத்தத்தைக் குறைக்க நெற்றி மற்றும் தோள்பட்டை பகுதிகளை மென்மையாக மசாஜ் செய்யவும்."
            ],
            "te": [
                "ప్రశాంతమైన, తక్కువ వెలుతురు ఉన్న గదిలో కళ్ళు మూసుకుని విశ్రాంతి తీసుకోండి.",
                "నుదిటిపై మరియు మెడ వెనుక చల్లని లేదా గోరువెచ్చని గుడ్డతో కాపడం పెట్టండి.",
                "మంచిగా నీరు త్రాగండి (శరీరంలో నీటి శాతం తగ్గడం తలనొప్పికి ప్రధాన కారణం).",
                "ఫోన్ మరియు కంప్యూటర్ స్క్రీన్లను చూడటం ఆపివేసి కళ్ళకు విశ్రాంతి ఇవ్వండి.",
                "ఒత్తిడి తగ్గడానికి నుదురు మరియు మెడ భాగాలను సున్నితంగా మర్దన చేసుకోండి."
            ]
        }
    },
    "stomach": {
        "specialty": "Gastroenterology",
        "keywords": [
            "stomach", "abdomen", "belly", "acidity", "gas", "indigestion", "bloating", "nausea", "vomit",
            "loose motion", "diarrhea", "constipation", "cramps", "gut",
            "पेट दर्द", "पेट खराब", "एसिडिटी", "गैस", "दस्त", "उल्टी", "कब्ज", "बदहजमी",
            "पोटदुखी", "पोटात दुखणे", "अॅसिडिटी", "उलटी", "जुलाब", "बद्धकोष्ठता",
            "வயிற்று வலி", "வயிற்றுப்போக்கு", "அசிடிட்டி", "வாந்தி", "செரிமானமின்மை",
            "కడుపు నొప్పి", "అజీర్ణం", "గ్యాస్", "వాంతులు", "విరేచనాలు", "మలబద్ధకం"
        ],
        "advisory": {
            "en": "Symptoms indicate digestive upset or gastric irritation. Light diet and electrolyte hydration are recommended.",
            "hi": "लक्षण पाचन विकार या पेट की खराबी का संकेत देते हैं। हल्का भोजन और ओआरएस/तरल पदार्थ लाभकारी हैं।",
            "mr": "लक्षणे पचनविकार किंवा पोटातील गडबड दर्शवतात. हलका आहार आणि द्रवपदार्थ घेणे फायदेशीर ठरेल.",
            "ta": "செரிமானக் கோளாறு அல்லது இரைப்பை எரிச்சலைக் குறிக்கிறது. எளிய உணவு மற்றும் நீர்ச்சத்து பரிந்துரைக்கப்படுகிறது.",
            "te": "జీర్ణ సమస్యలు లేదా గ్యాస్ట్రిక్ అసౌకర్యాన్ని సూచిస్తున్నాయి. తేలికపాటి ఆహారం తీసుకోవడం మంచిది."
        },
        "remedies": {
            "en": [
                "Sip warm water, ginger tea, or fresh coconut water to soothe the stomach lining.",
                "Follow a light, bland diet (khichdi, curd rice, plain toast, bananas, boiled potatoes).",
                "Sip Oral Rehydration Salts (ORS) or electrolyte water to maintain hydration balance.",
                "Strictly avoid spicy, oily, deep-fried, acidic, and caffeinated foods for 24-48 hours.",
                "Place a warm heating pad or hot water bag on your abdomen for comfort."
            ],
            "hi": [
                "पेट को आराम देने के लिए गुनगुना पानी, अदरक की चाय या नारियल पानी पिएं।",
                "हल्का और सुपाच्य भोजन लें (जैसे खिचड़ी, दही-चावल, सादा टोस्ट या केला)।",
                "शरीर में पानी और इलेक्ट्रोलाइट्स की कमी रोकने के लिए ओआरएस (ORS) का घोल पिएं।",
                "अगले 24-48 घंटों के लिए तला-भुना, मसालेदार, खट्टा और भारी खाना न खाएं।",
                "पेट पर गर्म पानी की थैली (हीटिंग पैड) से हल्की सिकाई करें।"
            ],
            "mr": [
                "पोटाला आराम मिळण्यासाठी कोमट पाणी, आल्याचा चहा किंवा नारळ पाणी प्या.",
                "हलका आणि पचायला सोपा आहार घ्या (खिचडी, दही-भात, केळी).",
                "शरीरातील पाण्याचे प्रमाण राखण्यासाठी ओआरएस (ORS) चे द्रावण प्या.",
                "तळलेले, तिखट, मसालेदार आणि जड अन्न पूर्णपणे टाळा.",
                "पोटावर गरम पाण्याच्या पिशवीने हलका शेक घ्या."
            ],
            "ta": [
                "வயிற்றுக்கு இதமளிக்க வெதுவெதுப்பான நீர், இஞ்சி தேநீர் அல்லது இளநீர் அருந்தவும்.",
                "எளிதில் செரிமானமாகும் உணவுகளை உட்கொள்ளவும் (கிச்சடி, தயிர் சாதம், வாழைப்பழம்).",
                "உடல் நீர்ச்சத்தை பராமரிக்க ஓ.ஆர்.எஸ் (ORS) கரைசல் குடிக்கவும்.",
                "காரமான, எண்ணெயில் பொரித்த மற்றும் அமிலத்தன்மை கொண்ட உணவுகளைத் தவிர்க்கவும்.",
                "வயிற்றுப் பகுதியில் சுடுநீர் ஒத்தடம் கொடுக்கவும்."
            ],
            "te": [
                "కడుపుకు ఉపశమనం కోసం గోరువెచ్చని నీరు, అల్లం టీ లేదా కొబ్బరి నీళ్లు త్రాగండి.",
                "తేలికగా జీర్ణమయ్యే ఆహారం తీసుకోండి (కిచిడీ, పెరుగన్నం, అరటిపండు).",
                "శరీరంలో నీటి శాతం తగ్గకుండా ఓ.ఆర్.ఎస్ (ORS) ద్రావణం త్రాగండి.",
                "మసాలా, నూనెలో వేయించిన మరియు కారమైన ఆహారాలను నివారించండి.",
                "కడుపుపై వేడి నీటి సంచితో కాపడం పెట్టండి."
            ]
        }
    },
    "fever": {
        "specialty": "General Medicine",
        "keywords": [
            "fever", "temperature", "chills", "shivering", "warm body", "hot forehead",
            "बुखार", "ताप", "कंपकंपी", "बदन गर्म",
            "ताप", "थंडी वाजणे", "अंग गरम",
            "காய்ச்சல்", "உடல் சூடு", "குளிர் நடுக்கம்",
            "జ్వరం", "చలి జ్వరం", "ఒళ్లు వేడిగా ఉండటం"
        ],
        "advisory": {
            "en": "Fever indicates the body's immune response. Supportive hydration and rest are recommended while monitoring temperature.",
            "hi": "बुखार शरीर की रोग प्रतिरोधक प्रतिक्रिया का संकेत है। पर्याप्त तरल पदार्थ और आराम की सलाह दी जाती है।",
            "mr": "ताप शरीराची रोगप्रतिकारक प्रतिक्रिया दर्शवतो. पुरेसे पाणी पिणे आणि विश्रांती घेणे आवश्यक आहे.",
            "ta": "காய்ச்சல் உடலின் நோய் எதிர்ப்பு எதிர்வினையைக் குறிக்கிறது. நீர்ச்சத்து மற்றும் ஓய்வு பரிந்துரைக்கப்படுகிறது.",
            "te": "జ్వరం శరీర రోగనిరోధక ప్రతిస్పందనను సూచిస్తుంది. మంచి విశ్రాంతి మరియు ద్రవాలు తీసుకోవాలి."
        },
        "remedies": {
            "en": [
                "Drink plenty of fluids (warm boiled water, coconut water, thin vegetable broths).",
                "Apply a clean, damp room-temperature cloth sponge across forehead and neck.",
                "Wear loose, lightweight, breathable cotton clothes; do not bundle up in heavy blankets.",
                "Take complete physical rest and log your body temperature every 4 hours."
            ],
            "hi": [
                "भरपूर मात्रा में तरल पदार्थ लें (उबला गुनगुना पानी, ओआरएस, हल्का सूप)।",
                "माथे और गर्दन पर सामान्य तापमान के पानी की ठंडी पट्टी रखें।",
                "ढीले और आरामदायक सूती कपड़े पहनें, बहुत भारी कंबल न ओढ़ें।",
                "पूरी तरह से आराम करें और हर 4 घंटे में तापमान थर्मामीटर से मापें।"
            ],
            "mr": [
                "भरपूर द्रवपदार्थ प्या (कोमट उकळलेले पाणी, नारळ पाणी, सूप).",
                "कपाळावर आणि मानेवर पाण्याच्या पट्ट्या ठेवून अंग पुसून घ्या.",
                "सैल आणि सुती कपडे वापरा, जाड पांघरूण अंगावर घेणे टाळा.",
                "पूर्ण विश्रांती घ्या आणि दर ४ तासांनी ताप तपासा."
            ],
            "ta": [
                "அதிகளவு திரவங்களை அருந்தவும் (கொதித்து ஆறிய நீர், இளநீர், சூப்).",
                "நெற்றி மற்றும் கழுத்துப் பகுதியில் சாதாரண நீர் ஒத்தடம் கொடுக்கவும்.",
                "மெல்லிய பருத்தி ஆடைகளை அணியவும், தடிமனான போர்வைகளைத் தவிர்க்கவும்.",
                "நன்றாக ஓய்வெடுக்கவும், 4 மணி நேரத்திற்கு ஒருமுறை உடல் வெப்பநிலையைக் கண்காணிக்கவும்."
            ],
            "te": [
                "ఎక్కువగా ద్రవాలు తీసుకోండి (కాచి చల్లార్చిన నీరు, కొబ్బరి నీళ్లు, సూప్స్).",
                "నుదిటిపై మరియు మెడపై తడి గుడ్డతో కాపడం పెట్టండి.",
                "తేలికపాటి కాటన్ దుస్తులు ధరించండి, మందపాటి దుప్పట్లు కప్పుకోవద్దు.",
                "మంచి విశ్రాంతి తీసుకోండి మరియు ప్రతి 4 గంటలకు జ్వరాన్ని కొలవండి."
            ]
        }
    },
    "cough_cold": {
        "specialty": "ENT / General Medicine",
        "keywords": [
            "cough", "cold", "throat", "sore throat", "phlegm", "mucus", "runny nose", "blocked nose", "sneezing", "congestion", "sinus",
            "खांसी", "जुकाम", "गला खराब", "कफ", "छींक", "नाक बहना", "बंद नाक",
            "खोकला", "सर्दी", "घसा दुखणे", "कफ", "नाक वाहणे", "शिंका",
            "இருமல்", "சளி", "தொண்டை வலி", "மூக்கடைப்பு", "தும்மல்",
            "దగ్గు", "జలుబు", "గొంతు నొప్పి", "కఫం", "ముక్కు కారడం", "తుమ్ములు"
        ],
        "advisory": {
            "en": "Symptoms point to upper respiratory tract congestion or throat irritation. Soothing steam and warm fluids are advised.",
            "hi": "लक्षण ऊपरी श्वसन तंत्र में जकड़न या गले में खराश का संकेत देते हैं। भाप लेना और गुनगुना पानी लाभकारी है।",
            "mr": "लक्षणे श्वसनमार्गातील सर्दी किंवा घशाचा त्रास दर्शवतात. वाफ घेणे आणि कोमट पाणी पिणे फायदेशीर आहे.",
            "ta": "சுவாசக்குழாய் சளி அல்லது தொண்டை அரிப்பைக் குறிக்கிறது. ஆவி பிடித்தல் மற்றும் வெதுவெதுப்பான நீர் சிறந்தது.",
            "te": "శ్వాసకోశ ఇన్ఫెక్షన్ లేదా గొంతు అసౌకర్యాన్ని సూచిస్తున్నాయి. ఆవిరి పట్టడం మరియు గోరువెచ్చని నీరు మంచిది."
        },
        "remedies": {
            "en": [
                "Gargle with warm salt water 2-3 times daily to soothe throat inflammation.",
                "Take steam inhalation for 5-10 minutes with tulsi or mint to open nasal airways.",
                "Sip warm water, herbal teas with ginger, tulsi and honey, or warm soups.",
                "Keep head slightly elevated while sleeping to ease night-time breathing."
            ],
            "hi": [
                "गले की खराश और दर्द के लिए दिन में 2-3 बार गुनगुने नमक के पानी से गरारे करें।",
                "बंद नाक और श्वास नली खोलने के लिए 5-10 मिनट भाप (स्टीम) लें।",
                "गुनगुना पानी, अदरक-तुलसी की चाय, शहद या गर्म सूप का सेवन करें।",
                "रात को सोते समय सिर को थोड़ा ऊंचा रखें ताकि सांस लेने में आसानी हो।"
            ],
            "mr": [
                "घशाच्या त्रासासाठी दिवसातून २-३ वेळा कोमट मिठाच्या पाण्याने गुळण्या करा.",
                "श्वासनलिका मोकळी करण्यासाठी ५-१० मिनिटे पाण्याची वाफ घ्या.",
                "कोमट पाणी, आले-तुळशीचा काढा, मध किंवा गरम सूप प्या.",
                "झोपताना डोके थोडे वर ठेवा जेणेकरून श्वास घेणे सोपे होईल."
            ],
            "ta": [
                "தொண்டை வலிக்கு வெதுவெதுப்பான உப்பு நீரில் 2-3 முறை வாய் கொப்பளிக்கவும்.",
                "மூக்கடைப்பு நீங்க 5-10 நிமிடங்கள் ஆவி பிடிக்கவும்.",
                "வெதுவெதுப்பான நீர், இஞ்சி-துளசி தேநீர் அல்லது சூப் குடிக்கவும்.",
                "இரவில் சுவாசம் சீராக இருக்க தலையை சற்று உயர்த்தி வைத்து படுக்கவும்."
            ],
            "te": [
                "గొంతు నొప్పి ఉపశమనం కోసం రోజుకు 2-3 సార్లు గోరువెచ్చని ఉప్పు నీటితో పుక్కిలించండి.",
                "ముక్కు దిబ్బడ తగ్గడానికి 5-10 నిమిషాలు ఆవిరి పట్టండి.",
                "గోరువెచ్చని నీరు, అల్లం-తులసి టీ, తేనె లేదా వేడి సూప్స్ త్రాగండి.",
                "నిద్రపోయేటప్పుడు శ్వాస సులభంగా ఉండటానికి తలని కొద్దిగా ఎత్తుగా ఉంచండి."
            ]
        }
    },
    "back_joint_pain": {
        "specialty": "Orthopedics",
        "keywords": [
            "back pain", "backache", "joint pain", "knee pain", "neck pain", "shoulder pain", "muscle pain", "sprain", "stiffness", "body ache",
            "पीठ दर्द", "कमर दर्द", "जोड़ों में दर्द", "घुटने में दर्द", "गर्दन दर्द", "मांसपेशियों में दर्द", "मोच",
            "पाठदुखी", "कंबरदुखी", "सांधेदुखी", "गुडघेदुखी", "मानदुखी", "स्नायूदुखी",
            "முதுகு வலி", "இடுப்பு வலி", "மூட்டு வலி", "கழுத்து வலி", "தசை வலி",
            "వెన్నునొప్పి", "కీళ్ల నొప్పులు", "మెడ నొప్పి", "మోకాళ్ళ నొప్పులు", "కండరాల నొప్పులు"
        ],
        "advisory": {
            "en": "Symptoms indicate musculoskeletal strain or posture-related stiffness. Gentle rest, hot/cold packs, and ergonomic support are advised.",
            "hi": "लक्षण मांसपेशियों में खिंचाव या जोड़ों में जकड़न का संकेत देते हैं। सिकाई और सही मुद्रा में बैठना लाभकारी है।",
            "mr": "लक्षणे स्नायूंचा ताण किंवा सांध्यांची आखड दर्शवतात. शेक घेणे आणि विश्रांती फायदेशीर ठरेल.",
            "ta": "தசைப்பிடிப்பு அல்லது மூட்டு இறுக்கத்தைக் குறிக்கிறது. ஒத்தடம் கொடுத்தல் மற்றும் சரியான தோரணை அவசியம்.",
            "te": "కండరాల ఒత్తిడి లేదా కీళ్ల నొప్పులను సూచిస్తున్నాయి. కాపడం పెట్టడం మరియు విశ్రాంతి తీసుకోవడం మంచిది."
        },
        "remedies": {
            "en": [
                "Apply a cold pack for the first 24-48 hours, followed by a warm heating pad.",
                "Maintain an ergonomic posture and avoid heavy lifting or sudden twisting.",
                "Do gentle mobility stretching; avoid prolonged bed rest (light walking helps).",
                "Keep the affected joint/limb supported and elevated when resting."
            ],
            "hi": [
                "दर्द वाली जगह पर पहले 24-48 घंटे बर्फ या ठंडी सिकाई करें, फिर गर्म सिकाई करें।",
                "उठते-बैठते समय सीधा बैठें, भारी वजन उठाने और अचानक झुकने से बचें।",
                "हल्की स्ट्रेचिंग करें, लंबे समय तक बिस्तर पर लेटे रहने के बजाय थोड़ा टहलें।",
                "आराम करते समय जोड़ों या पीठ को तकिए से सहारा दें।"
            ],
            "mr": [
                "पहिल्या २४-४८ तासांत बर्फाचा शेक द्या, त्यानंतर गरम पाण्याचा शेक द्या.",
                "बसताना पाठीचा कणा ताठ ठेवा, जड वस्तू उचलणे टाळा.",
                "हलके स्ट्रेचिंग व्यायाम करा, जास्त वेळ एकाच जागेवर झोपणे टाळा.",
                "विश्रांती घेताना सांध्यांना किंवा पाठीला उशीचा आधार द्या."
            ],
            "ta": [
                "வலிக்கான பகுதியில் ஆரம்பத்தில் குளிர்ந்த ஒத்தடமும், பின்னர் வெதுவெதுப்பான ஒத்தடமும் கொடுக்கவும்.",
                "நேராக நிமிர்ந்து அமரவும், அதிக எடையுள்ள பொருட்களைத் தூக்குவதைத் தவிர்க்கவும்.",
                "மென்மையான உடற்பயிற்சி மற்றும் லேசான நடைப்பயிற்சி மேற்கொள்ளவும்.",
                "ஓய்வு எடுக்கும் போது மூட்டுகளுக்கு தலையணை ஆதரவு கொடுக்கவும்."
            ],
            "te": [
                "నొప్పి ఉన్న చోట మొదట చల్లని కాపడం, తర్వాత వేడి కాపడం పెట్టండి.",
                "కూర్చున్నప్పుడు వెన్ను నిటారుగా ఉంచండి, బరువైన వస్తువులు ఎత్తవద్దు.",
                "తేలికపాటి స్ట్రెచింగ్ వ్యాయామాలు చేయండి, ఎక్కువసేపు పడుకోకుండా నడవండి.",
                "విశ్రాంతి సమయంలో కీళ్లకు లేదా వీపుకు దిండు మద్దతు ఇవ్వండి."
            ]
        }
    },
    "skin_rash": {
        "specialty": "Dermatology",
        "keywords": [
            "rash", "itching", "itchy", "skin allergy", "red spots", "pimples", "dry skin", "blisters",
            "खुजली", "दाने", "त्वचा की एलर्जी", "लाल चकत्ते", "मुंहासे",
            "खाज", "अंगावर पुरळ", "त्वचेची अलर्जी", "लाल डाग",
            "அரிப்பு", "தடிப்பு", "சரும ஒவ்வாமை", "சிவப்பு புள்ளிகள்",
            "దురద", "దద్దుర్లు", "చర్మ అలర్జీ", "ఎర్రటి మచ్చలు"
        ],
        "advisory": {
            "en": "Symptoms indicate localized skin irritation or mild allergic sensitivity. Soothing care and avoiding triggers are advised.",
            "hi": "लक्षण त्वचा में जलन या हल्की एलर्जी का संकेत देते हैं। साफ-सफाई और खुजलाने से बचना जरूरी है।",
            "mr": "लक्षणे त्वचेचा दाह किंवा अलर्जी दर्शवतात. स्वच्छता राखणे आणि खाजवणे टाळणे आवश्यक आहे.",
            "ta": "சரும எரிச்சல் அல்லது லேசான ஒவ்வாமையைக் குறிக்கிறது. மென்மையான பராமரிப்பு பரிந்துரைக்கப்படுகிறது.",
            "te": "చర్మ సమస్య లేదా అలర్జీని సూచిస్తున్నాయి. శుభ్రత పాటించడం మరియు గోకకుండా ఉండటం మంచిది."
        },
        "remedies": {
            "en": [
                "Wash the affected area gently with cool water and mild, fragrance-free soap.",
                "Apply a cool damp cloth or soothing calamine lotion to relieve itching.",
                "Wear loose, soft, breathable cotton clothing to prevent friction.",
                "Avoid hot showers, harsh soaps, perfumes, and resist scratching the area."
            ],
            "hi": [
                "प्रभावित त्वचा को ठंडे पानी और हल्के साबुन से धीरे-धीरे धोएं।",
                "खुजली और जलन से राहत के लिए कैलामाइन लोशन या ठंडी पट्टी लगाएं।",
                "ढीले और मुलायम सूती कपड़े पहनें ताकि त्वचा पर रगड़ न लगे।",
                "गर्म पानी से नहाने, परफ्यूम और त्वचा को खुजलाने से बचें।"
            ],
            "mr": [
                "त्वचा थंड पाण्याने आणि सौम्य साबणाने स्वच्छ धुवा.",
                "खाज कमी करण्यासाठी कॅलामाइन लोशन किंवा थंड ओल्या कापडाचा शेक द्या.",
                "सैल आणि मऊ सुती कपडे वापरा जेणेकरून त्वचेला घर्षण होणार नाही.",
                "गरम पाण्याने आंघोळ करणे आणि खाजवणे पूर्णपणे टाळा."
            ],
            "ta": [
                "பாதிக்கப்பட்ட சருமத்தை குளிர்ந்த நீரால் மென்மையாகக் கழுவவும்.",
                "அரிப்பைக் குறைக்க கலாமைன் லோஷன் அல்லது குளிர்ந்த துணி ஒத்தடம் வைக்கவும்.",
                "மென்மையான பருத்தி ஆடைகளை அணியவும்.",
                "சூடான நீரில் குளிப்பதையும், சொறிவதையும் தவிர்க்கவும்."
            ],
            "te": [
                "ప్రభావిత చర్మాన్ని చల్లని నీటితో మరియు తేలికపాటి సబ్బుతో శుభ్రం చేయండి.",
                "దురద తగ్గడానికి కాలమైన్ లోషన్ లేదా చల్లని తడి గుడ్డ పెట్టండి.",
                "వదులుగా ఉండే కాటన్ దుస్తులు ధరించండి.",
                "వేడి నీటి స్నానం మరియు గోకడం నివారించండి."
            ]
        }
    },
    "eye_strain": {
        "specialty": "Ophthalmology",
        "keywords": [
            "eye", "eyes", "eye pain", "eye strain", "burning eyes", "watery eyes", "dry eyes", "blurred vision",
            "आंखों में दर्द", "आंखों में जलन", "आंखों से पानी", "धुंधला दिखना",
            "डोळे दुखणे", "डोळ्यात जळजळ", "डोळ्यातून पाणी",
            "கண் வலி", "கண் எரிச்சல்", "கண்ணில் நீர் வடிதல்",
            "కళ్ల నొప్పి", "కళ్ల మంట", "కళ్లలో నీరు కారడం"
        ],
        "advisory": {
            "en": "Symptoms indicate eye fatigue or digital screen strain. Visual rest and ambient lighting adjustments are recommended.",
            "hi": "लक्षण आंखों में थकान या स्क्रीन तनाव का संकेत देते हैं। आंखों को आराम देना और रोशनी सही रखना लाभकारी है।",
            "mr": "लक्षणे डोळ्यांचा थकवा दर्शवतात. डोळ्यांना विश्रांती देणे आवश्यक आहे.",
            "ta": "கண் சோர்வு அல்லது திரைப் பயன்பாட்டால் ஏற்படும் அசௌகரியத்தைக் குறிக்கிறது. ஓய்வு பரிந்துரைக்கப்படுகிறது.",
            "te": "కంటి అలసట లేదా స్క్రీన్ ఒత్తిడిని సూచిస్తున్నాయి. కళ్లకు విశ్రాంతి ఇవ్వడం మంచిది."
        },
        "remedies": {
            "en": [
                "Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.",
                "Splash eyes with clean, cool water and rest with a cool eye compress.",
                "Reduce screen brightness, use blue-light filters, and ensure good room lighting.",
                "Get 7-8 hours of restful sleep and avoid rubbing your eyes."
            ],
            "hi": [
                "20-20-20 नियम अपनाएं: हर 20 मिनट बाद 20 सेकंड के लिए 20 फीट दूर देखें।",
                "आंखों पर साफ ठंडे पानी के छींटे मारें और ठंडी पट्टी रखकर आराम दें।",
                "मोबाइल/स्क्रीन की ब्राइटनेस कम करें और कमरे में पर्याप्त रोशनी रखें।",
                "पर्याप्त नींद लें और आंखों को हाथों से रगड़ने से बचें।"
            ],
            "mr": [
                "२०-२०-२० नियम पाळा: दर २० मिनिटांनी २० सेकंदांसाठी २० फूट दूर पाहा.",
                "डोळ्यांवर थंड पाण्याचे हबके मारा आणि डोळे मिटून विश्रांती घ्या.",
                "स्क्रीनचा प्रकाश कमी करा आणि खोलीत योग्य प्रकाश ठेवा.",
                "पुरेशी झोप घ्या आणि डोळे चोळणे टाळा."
            ],
            "ta": [
                "20-20-20 விதியை பின்பற்றவும்: ஒவ்வொரு 20 நிமிடங்களுக்கும் 20 அடி தூரத்தை 20 வினாடிகள் பார்க்கவும்.",
                "கண்களில் சுத்தமான குளிர்ந்த நீரைத் தெளித்து ஓய்வெடுக்கவும்.",
                "திரை வெளிச்சத்தைக் குறைத்து, அறையில் நல்ல வெளிச்சத்தை வைக்கவும்.",
                "நன்றாக தூங்கவும், கண்களைத் தேய்ப்பதைத் தவிர்க்கவும்."
            ],
            "te": [
                "20-20-20 నియమం పాటించండి: ప్రతి 20 నిమిషాలకు 20 అడుగుల దూరాన్ని 20 సెకన్లు చూడండి.",
                "కళ్లను శుభ్రమైన చల్లని నీటితో కడగండి మరియు కాసేపు విశ్రాంతి ఇవ్వండి.",
                "స్క్రీన్ ప్రకాశాన్ని తగ్గించండి మరియు గదిలో మంచి వెలుతురు ఉంచండి.",
                "మంచి నిద్ర తీసుకోండి మరియు కళ్లను నలపవద్దు."
            ]
        }
    },
    "fatigue": {
        "specialty": "General Medicine",
        "keywords": [
            "fatigue", "tired", "tiredness", "weakness", "dizziness", "dizzy", "exhausted", "low energy",
            "थकान", "कमजोरी", "चक्कर आना", "सुस्ती", "ऊर्जा की कमी",
            "थकवा", "अशक्तपणा", "चक्कर येणे", "सुस्ती",
            "சோர்வு", "பலவீனம்", "தலைச்சுற்றல்",
            "అలసట", "నీరసం", "తలతిరగడం", "బలహీనత"
        ],
        "advisory": {
            "en": "Symptoms indicate physical fatigue or energy depletion. Proper hydration, nutritious meals, and rest are advised.",
            "hi": "लक्षण शारीरिक थकान या कमजोरी का संकेत देते हैं। पौष्टिक आहार, तरल पदार्थ और पर्याप्त नींद लें।",
            "mr": "लक्षणे शारीरिक थकवा किंवा अशक्तपणा दर्शवतात. पोषक आहार आणि विश्रांती आवश्यक आहे.",
            "ta": "உடல் சோர்வு அல்லது பலவீனத்தைக் குறிக்கிறது. சத்தான உணவு மற்றும் நல்ல தூக்கம் தேவை.",
            "te": "శారీరక అలసట లేదా నీరసాన్ని సూచిస్తున్నాయి. పోషకాహారం మరియు తగినంత విశ్రాంతి అవసరం."
        },
        "remedies": {
            "en": [
                "Drink fresh electrolyte water, lemon water with a pinch of salt, or coconut water.",
                "Eat balanced, easy-to-digest meals rich in fresh fruits, nuts, and proteins.",
                "Avoid sudden standing from sitting or lying down; get up slowly.",
                "Ensure 7-9 hours of uninterrupted sleep and avoid strenuous exertion."
            ],
            "hi": [
                "नींबू पानी में चुटकी भर नमक, ओआरएस या नारियल पानी पीकर हाइड्रेटेड रहें।",
                "पौष्टिक और आसानी से पचने वाला ताजा खाना खाएं (फल, दालें, नट्स)।",
                "लेटे या बैठे होने पर एकदम से तेजी से न उठें, धीरे-धीरे खड़े हों।",
                "7-9 घंटे की अच्छी नींद लें और अत्यधिक शारीरिक श्रम से बचें।"
            ],
            "mr": [
                "लिंबू पाणी, नारळ पाणी किंवा इलेक्ट्रॉल पाणी प्या.",
                "पौष्टिक आणि सहज पचणारे अन्न खा (फळे, कडधान्ये).",
                "झोपेतून किंवा बसल्यावरून एकदम घाईने उठू नका.",
                "७-९ तासांची शांत झोप घ्या आणि जास्त धावपळ टाळा."
            ],
            "ta": [
                "எலுமிச்சை சாறு, இளநீர் அல்லது எலக்ட்ரோலைட் நீர் அருந்தவும்.",
                "சத்தான மற்றும் எளிதில் செரிமானமாகும் உணவுகளை உண்ணவும்.",
                "படுக்கையில் இருந்து திடீரென வேகமாக எழுந்திருக்க வேண்டாம்.",
                "7-9 மணி நேரம் ஆழ்ந்து தூங்கவும்."
            ],
            "te": [
                "నిమ్మకాయ నీరు, కొబ్బరి నీళ్లు లేదా ఎలక్ట్రోలైట్ ద్రావణం త్రాగండి.",
                "పోషకమైన మరియు సులభంగా జీర్ణమయ్యే ఆహారం తీసుకోండి.",
                "పడుకున్నప్పుడు లేదా కూర్చున్నప్పుడు ఒక్కసారిగా పైకి లేవకండి.",
                "7-9 గంటల మంచి నిద్ర తీసుకోండి."
            ]
        }
    }
}


def check_red_flags(symptoms: str) -> bool:
    symptoms_lower = symptoms.lower()
    for pattern in RED_FLAG_PATTERNS:
        if re.search(pattern, symptoms_lower):
            return True
    return False


def detect_symptom_category(symptoms: str) -> str:
    """Detects the specific ailment category based on multilingual keywords."""
    s_low = symptoms.lower()
    
    # Check each category's keywords
    for cat_name, cat_data in SYMPTOM_REMEDIES.items():
        for kw in cat_data["keywords"]:
            if kw.lower() in s_low:
                return cat_name
                
    return "general"


def get_mock_triage(symptoms: str, language: str = "en") -> TriageAssessment:
    lang = language if language in ["en", "hi", "mr", "ta", "te"] else "en"
    has_red_flags = check_red_flags(symptoms)
    symptoms_lower = symptoms.lower()
    
    is_urgent = has_red_flags or any(k in symptoms_lower for k in [
        "severe", "acute", "unbearable", "bleeding", "fracture",
        "गंभीर", "असहनीय", "तीव्र", "கடுமையான", "తీవ్రమైన"
    ])
    
    if is_urgent:
        urgency = UrgencyLevel.EMERGENCY if has_red_flags else UrgencyLevel.URGENT
        is_severe = True
        remedies = []
        specialty = "Emergency Medicine"
        advisory_map = {
            "en": "Immediate clinical evaluation is required for your symptoms. Please proceed to the nearest medical emergency facility.",
            "hi": "आपके लक्षणों के लिए तत्काल चिकित्सकीय मूल्यांकन की आवश्यकता है। कृपया तुरंत नजदीकी अस्पताल में संपर्क करें।",
            "mr": "आपल्या लक्षणांसाठी त्वरित वैद्यकीय तपासणी आवश्यक आहे. कृपया जवळच्या रुग्णालयाशी त्वरित संपर्क साधा.",
            "ta": "உங்கள் அறிகுறிகளுக்கு உடனடி மருத்துவ பரிசோதனை தேவை. உடனடியாக அருகிலுள்ள மருத்துவமனைக்குச் செல்லவும்.",
            "te": "మీ లక్షణాలకు తక్షణ వైద్య పరీక్ష అవసరం. దయచేసి వెంటనే సమీప ఆసుపత్రికి వెళ్లండి."
        }
        next_steps = ["Proceed to nearest Emergency Ward immediately", "Call 108 Emergency Ambulance", "Keep patient in resting position"]
    else:
        urgency = UrgencyLevel.ROUTINE
        is_severe = False
        cat = detect_symptom_category(symptoms)
        
        if cat in SYMPTOM_REMEDIES:
            cat_info = SYMPTOM_REMEDIES[cat]
            specialty = cat_info["specialty"]
            advisory = cat_info["advisory"].get(lang, cat_info["advisory"]["en"])
            remedies = cat_info["remedies"].get(lang, cat_info["remedies"]["en"])
        else:
            specialty = "General Medicine"
            advisory = {
                "en": "Symptoms evaluated. Condition appears manageable with initial supportive care advice and rest.",
                "hi": "लक्षणों का मूल्यांकन किया गया। स्थिति प्रारंभिक स्वास्थ्य सलाह और उचित आराम से प्रबंधनीय प्रतीत होती है।",
                "mr": "लक्षणांचे मूल्यांकन केले. योग्य काळजी आणि विश्रांतीने स्थिती नियंत्रणात येऊ शकते.",
                "ta": "அறிகுறிகள் மதிப்பிடப்பட்டன. ஆரம்ப கட்ட சுகாதார ஆலோசனை மூலம் இதைக் கையாளலாம்.",
                "te": "లక్షణాలు అంచనా వేయబడ్డాయి. ప్రారంభ ఆరోగ్య సలహాలతో దీనిని నిర్వహించవచ్చు."
            }.get(lang, "Symptoms evaluated. Supportive care and rest are advised.")
            remedies = [
                "Drink plenty of water and stay well hydrated.",
                "Get adequate physical rest in a comfortable environment.",
                "Eat light, easily digestible, and nutritious meals.",
                "Consult a qualified healthcare professional if symptoms persist beyond 48 hours."
            ]
            
        next_steps = ["Follow recommended health guidance", "Consult doctor if symptoms worsen or persist after 48h"]

    return TriageAssessment(
        urgency_level=urgency,
        primary_symptoms=[symptoms],
        red_flags_present=has_red_flags,
        potential_categories=["General Medicine"] if not has_red_flags else ["Emergency"],
        recommended_specialty=specialty,
        advisory_summary=advisory_map.get(lang, advisory_map["en"]) if is_severe else advisory,
        next_steps=next_steps,
        home_remedies=remedies,
        is_severe=is_severe,
        mandatory_disclaimer="DISCLAIMER: This assessment is generated by an AI assistant for informational and triage routing purposes only. It is NOT a medical diagnosis. Please confirm with a qualified healthcare professional."
    )


async def assess_symptoms(symptoms: str, language: str = "en") -> TriageAssessment:
    lang = language if language in ["en", "hi", "mr", "ta", "te"] else "en"
    
    if check_red_flags(symptoms):
        return get_mock_triage(symptoms, language=lang)

    # Try LLM if API key is provided
    if settings.OPENAI_API_KEY:
        try:
            import instructor
            from openai import AsyncOpenAI
            
            client = instructor.from_openai(AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=6.0))
            assessment = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                response_model=TriageAssessment,
                messages=[
                    {"role": "system", "content": TRIAGE_SYSTEM_PROMPT.format(language=lang)},
                    {"role": "user", "content": f"Target Language: {lang}\nPatient Symptoms: {symptoms}"}
                ],
                temperature=0.2
            )
            
            if assessment.urgency_level in [UrgencyLevel.EMERGENCY, UrgencyLevel.URGENT]:
                assessment.is_severe = True
            else:
                assessment.is_severe = False
                # If LLM didn't return condition-specific remedies, fill with our clinical catalog
                if not assessment.home_remedies or len(assessment.home_remedies) < 2:
                    cat = detect_symptom_category(symptoms)
                    if cat in SYMPTOM_REMEDIES:
                        assessment.home_remedies = SYMPTOM_REMEDIES[cat]["remedies"].get(lang, SYMPTOM_REMEDIES[cat]["remedies"]["en"])
                    
            return assessment
        except Exception as e:
            logger.warning(f"LLM triage fallback to clinical rules: {e}")

    return get_mock_triage(symptoms, language=lang)
