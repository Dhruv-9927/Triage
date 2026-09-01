import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class TranslationProvider:
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        raise NotImplementedError

class MockTranslationProvider(TranslationProvider):
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return text

class GoogleTranslationProvider(TranslationProvider):
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not hasattr(settings, 'GOOGLE_TRANSLATE_API_KEY') or not settings.GOOGLE_TRANSLATE_API_KEY:
            logger.warning("GOOGLE_TRANSLATE_API_KEY not set, falling back to mock")
            return text
            
        url = "https://translation.googleapis.com/language/translate/v2"
        params = {
            "key": settings.GOOGLE_TRANSLATE_API_KEY,
            "q": text,
            "source": source_lang,
            "target": target_lang,
            "format": "text"
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, data=params)
                response.raise_for_status()
                result = response.json()
                return result["data"]["translations"][0]["translatedText"]
            except Exception as e:
                logger.error(f"Google Translate API failed: {e}")
                return text

class BhashiniTranslationProvider(TranslationProvider):
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not hasattr(settings, 'BHASHINI_API_KEY') or not hasattr(settings, 'BHASHINI_USER_ID'):
            logger.warning("Bhashini credentials not set, falling back to mock")
            return text
            
        url = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
        headers = {
            "Authorization": settings.BHASHINI_API_KEY,
            "userID": settings.BHASHINI_USER_ID,
            "Content-Type": "application/json"
        }
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source_lang,
                            "targetLanguage": target_lang
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
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                result = response.json()
                return result["pipelineResponse"][0]["output"][0]["target"]
            except Exception as e:
                logger.error(f"Bhashini Translation API failed: {e}")
                return text

def get_translation_provider() -> TranslationProvider:
    provider_name = getattr(settings, 'TRANSLATION_PROVIDER', 'mock')
    if provider_name == "google":
        return GoogleTranslationProvider()
    elif provider_name == "bhashini":
        return BhashiniTranslationProvider()
    return MockTranslationProvider()

async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    if source_lang == target_lang:
        return text
    provider = get_translation_provider()
    return await provider.translate(text, source_lang, target_lang)

def detect_language(text: str) -> str:
    for char in text:
        if '\u0900' <= char <= '\u097F':
            return 'hi'
        if '\u0C80' <= char <= '\u0CFF':
            return 'kn'
        if '\u0B80' <= char <= '\u0BFF':
            return 'ta'
        if '\u0C00' <= char <= '\u0C7F':
            return 'te'
    return 'en'
