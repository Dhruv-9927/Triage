from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.fsm.context import FSMContext
from app.bot.states import RegistrationStates
from app.bot.keyboards import gender_keyboard, confirm_keyboard, main_menu_keyboard
from app.bot.bot import get_db_session
from app.bot.i18n import get_text
from app.services.user_linking_service import get_or_create_telegram_user

router = Router()


@router.message(Command("cancel"))
async def cancel_handler(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("Cancelled.", reply_markup=ReplyKeyboardRemove())


@router.callback_query(F.data == "menu_register")
async def start_registration(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')
    await state.set_state(RegistrationStates.process_name)
    await callback.message.answer(get_text("ask_name", lang))


@router.message(RegistrationStates.process_name)
async def process_name(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')
    if not message.text or not message.text.strip():
        await message.answer(get_text("invalid_name", lang))
        return
    await state.update_data(full_name=message.text.strip())
    await state.set_state(RegistrationStates.process_age)
    await message.answer(get_text("ask_age", lang))


@router.message(RegistrationStates.process_age)
async def process_age(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')
    if not message.text or not message.text.isdigit() or not (1 <= int(message.text) <= 120):
        await message.answer(get_text("invalid_age", lang))
        return
    await state.update_data(age=int(message.text))
    await state.set_state(RegistrationStates.process_gender)
    await message.answer(get_text("ask_gender", lang), reply_markup=gender_keyboard(lang))


@router.callback_query(RegistrationStates.process_gender)
async def process_gender(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')
    gender = callback.data.split('_')[1]
    await state.update_data(gender=gender)
    await state.set_state(RegistrationStates.process_phone)

    phone_kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=get_text("share_contact", lang), request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    await callback.message.answer(get_text("ask_phone", lang), reply_markup=phone_kb)


@router.message(RegistrationStates.process_phone)
async def process_phone(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')
    phone = ""
    if message.contact:
        phone = message.contact.phone_number
    elif message.text:
        phone = message.text.strip()

    if not phone:
        await message.answer(get_text("invalid_phone", lang))
        return

    await state.update_data(phone=phone)
    await state.set_state(RegistrationStates.process_location)

    loc_kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=get_text("share_location", lang), request_location=True)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    await message.answer(get_text("ask_location", lang), reply_markup=loc_kb)


@router.message(RegistrationStates.process_location)
async def process_location(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')
    if message.location:
        await state.update_data(latitude=message.location.latitude, longitude=message.location.longitude)

    await state.set_state(RegistrationStates.confirm_registration)
    user_data = await state.get_data()
    gender_display = get_text(user_data.get('gender', 'other'), lang)
    summary = f"• {user_data.get('full_name')}\n• {user_data.get('age')} years\n• {gender_display}\n• 📞 {user_data.get('phone')}"
    await message.answer(
        get_text("confirm_reg_summary", lang) + "\n\n" + summary,
        reply_markup=confirm_keyboard(lang)
    )


@router.callback_query(RegistrationStates.confirm_registration, F.data == "confirm_yes")
async def confirm_registration(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')

    async with get_db_session() as db:
        user, patient, is_new = await get_or_create_telegram_user(
            db,
            chat_id=callback.message.chat.id,
            full_name=data.get('full_name', 'Unknown'),
            phone=data.get('phone'),
            language=lang
        )
        await state.update_data(patient_id=str(patient.id))

    await callback.message.answer(get_text("reg_success", lang), reply_markup=main_menu_keyboard(lang))
    await state.clear()
    await state.update_data(language=lang)


@router.callback_query(RegistrationStates.confirm_registration, F.data == "confirm_no")
async def edit_registration(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await start_registration(callback, state)
