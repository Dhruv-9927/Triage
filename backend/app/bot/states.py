from aiogram.fsm.state import State, StatesGroup

class RegistrationStates(StatesGroup):
    process_name = State()
    process_age = State()
    process_gender = State()
    process_phone = State()
    process_location = State()
    confirm_registration = State()

class TriageStates(StatesGroup):
    waiting_symptoms = State()
    processing = State()
    showing_result = State()
    selecting_facility = State()

class BookingStates(StatesGroup):
    awaiting_location = State()
    selecting_facility = State()
    selecting_doctor = State()
    selecting_slot = State()
    confirming = State()


class QueueStates(StatesGroup):
    viewing_tokens = State()
    checking_in = State()
