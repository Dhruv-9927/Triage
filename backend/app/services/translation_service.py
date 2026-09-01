import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Standard language code normalization for Indian languages
LANG_CODE_MAP = {
    "en": "en",
    "hi": "hi",
    "bn": "bn",
    "ta": "ta",
    "te": "te",
    "mr": "mr",
    "gu": "gu",
    "kn": "kn",
    "ml": "ml",
    "pa": "pa",
    "or": "or",
    "ur": "ur",
}

class TranslationProvider:
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        raise NotImplementedError

class MockTranslationProvider(TranslationProvider):
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return text

class GoogleTranslationProvider(TranslationProvider):
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return text

class BhashiniTranslationProvider(TranslationProvider):
    """
    Official Government of India Bhashini (Anuvaad / Dhruva) NMT Translation Provider.
    Supports 22 scheduled Indian languages with low-bandwidth inference.
    """
    def __init__(self):
        self.user_id = settings.BHASHINI_USER_ID
        self.api_key = settings.BHASHINI_API_KEY
        self.inference_url = settings.BHASHINI_INFERENCE_URL

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return text
        
        src = LANG_CODE_MAP.get(source_lang.lower().split('-')[0], "en")
        tgt = LANG_CODE_MAP.get(target_lang.lower().split('-')[0], "hi")
        
        if src == tgt:
            return text

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": src,
                            "targetLanguage": tgt
                        }
                    }
                }
            ],
            "inputData": {
                "input": [
                    {
                        "source": text
                    }
                ]
            }
        }

        headers = {
            "Content-Type": "application/json",
            "userID": self.user_id,
            "ulcaApiKey": self.user_id,
            "Authorization": self.api_key
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    self.inference_url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    pipeline_res = data.get("pipelineResponse", [])
                    if pipeline_res and "output" in pipeline_res[0]:
                        output_list = pipeline_res[0]["output"]
                        if output_list and "target" in output_list[0]:
                            translated_text = output_list[0]["target"]
                            logger.info(f"Bhashini Translated [{src} -> {tgt}]: '{text}' -> '{translated_text}'")
                            return translated_text
                else:
                    logger.warning(f"Bhashini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Bhashini Translation exception: {str(e)}")

        # Fallback to original text if Bhashini is unreachable
        return text

def get_translation_provider() -> TranslationProvider:
    if settings.TRANSLATION_PROVIDER == "bhashini" and settings.BHASHINI_API_KEY:
        return BhashiniTranslationProvider()
    elif settings.TRANSLATION_PROVIDER == "google":
        return GoogleTranslationProvider()
    return MockTranslationProvider()

async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    provider = get_translation_provider()
    return await provider.translate(text, source_lang, target_lang)
