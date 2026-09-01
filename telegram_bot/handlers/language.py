from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from app.bot.bot import get_db_session
from app.bot.keyboards import main_menu_keyboard, language_keyboard
from app.bot.i18n import get_text
from app.services.user_linking_service import update_language_preference

router = Router()


@router.callback_query(F.data.startswith('lang_'))
async def process_language(callback: CallbackQuery, state: FSMContext):
    lang_code = callback.data.split('_')[1]
    await state.update_data(language=lang_code)

    async with get_db_session() as db:
        try:
            await update_language_preference(db, callback.message.chat.id, lang_code)
        except Exception:
            pass

    welcome_text = get_text("main_menu_prompt", lang_code)
    await callback.message.edit_text(welcome_text, reply_markup=main_menu_keyboard(lang_code))
    await callback.answer()


@router.callback_query(F.data == "menu_language")
async def show_language_menu(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')
    prompt = get_text("select_language", lang)
    await callback.message.edit_text(prompt, reply_markup=language_keyboard())
    await callback.answer()


@router.message(Command('language'))
async def change_language(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')
    prompt = get_text("select_language", lang)
    await message.answer(prompt, reply_markup=language_keyboard())
