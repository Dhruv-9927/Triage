from app.bot.bot import bot
from app.bot.i18n import get_text

async def send_queue_update(chat_id: int, token_number: str, new_position: int, estimated_wait: int, lang: str = 'en'):
    msg = get_text("notify_queue_update", lang).format(
        token=token_number, pos=new_position, eta=estimated_wait
    )
    await bot.send_message(chat_id, msg)

async def send_appointment_reminder(chat_id: int, facility_name: str, doctor_name: str, time_str: str, lang: str = 'en'):
    msg = get_text("notify_appt_reminder", lang).format(
        fac=facility_name, doc=doctor_name, time=time_str
    )
    await bot.send_message(chat_id, msg)

async def send_booking_confirmation(chat_id: int, token_number: str, facility_name: str, doctor_name: str, time_str: str, position: int, lang: str = 'en'):
    msg = get_text("notify_booking_conf", lang).format(
        token=token_number, fac=facility_name, doc=doctor_name, time=time_str, pos=position
    )
    await bot.send_message(chat_id, msg)
