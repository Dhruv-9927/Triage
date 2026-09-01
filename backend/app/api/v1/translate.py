from fastapi import APIRouter
from pydantic import BaseModel
from app.services.translation_service import translate_text

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "hi"

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    provider: str = "Bhashini"

@router.post("/", response_model=TranslationResponse)
async def translate(req: TranslationRequest):
    translated = await translate_text(req.text, req.source_lang, req.target_lang)
    return TranslationResponse(
        original_text=req.text,
        translated_text=translated,
        source_lang=req.source_lang,
        target_lang=req.target_lang,
        provider="Bhashini"
    )
