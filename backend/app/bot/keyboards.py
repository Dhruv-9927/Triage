from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from app.bot.i18n import get_text


def language_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="English", callback_data="lang_en"), InlineKeyboardButton(text="हिन्दी", callback_data="lang_hi")],
        [InlineKeyboardButton(text="मराठी", callback_data="lang_mr"), InlineKeyboardButton(text="தமிழ்", callback_data="lang_ta")],
        [InlineKeyboardButton(text="తెలుగు", callback_data="lang_te")]
    ])


def main_menu_keyboard(lang: str = 'en') -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=get_text('check_symptoms', lang), callback_data="menu_triage")],
        [InlineKeyboardButton(text=get_text('book_appointment', lang), callback_data="menu_book")],
        [InlineKeyboardButton(text=get_text('nearby_hospitals', lang), callback_data="menu_nearby")],
        [InlineKeyboardButton(text=get_text('my_queue', lang), callback_data="menu_queue")],
        [InlineKeyboardButton(text=get_text('health_records', lang), callback_data="menu_records")],
        [InlineKeyboardButton(text=get_text('change_language', lang), callback_data="menu_language")]
    ])


def urgency_keyboard(is_emergency: bool, lang: str = 'en') -> InlineKeyboardMarkup:
    if is_emergency:
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=get_text('call_emergency_108', lang), callback_data="emergency_108_alert")]
        ])
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=get_text('view_facilities', lang), callback_data="show_facilities")]
    ])


def triage_mild_keyboard(lang: str = 'en') -> InlineKeyboardMarkup:
    """Keyboard shown for MILD/ROUTINE triage with doctor booking button."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=get_text('book_doctor_optional_btn', lang), callback_data="show_facilities")]
    ])


def facility_keyboard(facilities: list, lang: str = 'en') -> InlineKeyboardMarkup:
    buttons = []
    for f in facilities:
        if isinstance(f, dict):
            fac_id = f.get("id")
            name = f.get("name", "Hospital")
            dist = f.get("distance_km")
            label = f"🏥 {name} ({dist} km)" if dist is not None else f"🏥 {name}"
        else:
            fac_id = getattr(f, "id", "")
            name = getattr(f, "name", "Hospital")
            label = f"🏥 {name}"
        buttons.append([InlineKeyboardButton(text=label, callback_data=f"fac_{fac_id}")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)



def confirm_keyboard(lang: str = 'en') -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=get_text('confirm', lang), callback_data="confirm_yes"),
            InlineKeyboardButton(text=get_text('cancel', lang), callback_data="confirm_no")
        ]
    ])


def gender_keyboard(lang: str = 'en') -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=get_text('male', lang), callback_data="gender_male")],
        [InlineKeyboardButton(text=get_text('female', lang), callback_data="gender_female")],
        [InlineKeyboardButton(text=get_text('other', lang), callback_data="gender_other")]
    ])


def quick_cities_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📍 Jaipur", callback_data="city_jaipur"), InlineKeyboardButton(text="📍 Delhi / NCR", callback_data="city_delhi")],
        [InlineKeyboardButton(text="📍 Mumbai", callback_data="city_mumbai"), InlineKeyboardButton(text="📍 Pune", callback_data="city_pune")],
        [InlineKeyboardButton(text="📍 Bangalore", callback_data="city_bangalore"), InlineKeyboardButton(text="📍 Hyderabad", callback_data="city_hyderabad")],
        [InlineKeyboardButton(text="📍 Chennai", callback_data="city_chennai"), InlineKeyboardButton(text="📍 Kolkata", callback_data="city_kolkata")],
        [InlineKeyboardButton(text="✏️ Type Another City / Area", callback_data="city_manual_type")]
    ])



def location_request_keyboard(lang: str = 'en') -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=get_text('share_location', lang), request_location=True)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )



def token_actions_keyboard(token_id: str, lang: str = 'en') -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=get_text('check_in', lang), callback_data=f"checkin_{token_id}")],
        [InlineKeyboardButton(text=get_text('cancel', lang), callback_data=f"cancel_{token_id}")]
    ])


def slot_keyboard(slots_info: list, lang: str = 'en') -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text=get_text(slot_key, lang), callback_data=f"slot_{raw_val}")]
        for slot_key, raw_val in slots_info
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
