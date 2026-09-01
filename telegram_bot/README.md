# 🤖 Triage+ AI Multilingual Telegram Bot (`@TriageSmartBot`)

This folder contains the complete, production-ready codebase for the **Triage+ AI Telegram Bot**. It is fully modular and ready to be pushed to your repository or shared with teammates.

---

## 🌟 Key Features

1. **Intelligent Clinical Triage Gatekeeper**:
   - **🔴 Severe / Urgent Cases (`EMERGENCY` / `URGENT`)**: Automatically books an urgent doctor ticket on the hospital queue, generates a priority token (`#1`), and sends emergency routing.
   - **🟢 Mild / Routine Cases (`ROUTINE` / `MILD`)**: Suggests structured **Health Advice & Care Guidance** (hydration, rest, steam, monitoring) without congesting hospital queues, and provides an optional button to book a doctor.
2. **📅 Multilingual Appointment Booking**:
   - Interactive flow: Hospital Selection $\rightarrow$ Doctor Selection $\rightarrow$ Time Slot Selection $\rightarrow$ Booking Confirmation $\rightarrow$ Instant Token Card.
3. **🎫 Live Queue Management**:
   - Patients track their live position (`#1, #2, #3...`), estimated wait times, and check-in directly at the facility.
4. **📋 Health Records & Consultation History**:
   - View past triage assessments and appointment details.
5. **🌐 5-Language Native Localization**:
   - Full native UI support for **हिन्दी (Hindi), मराठी (Marathi), தமிழ் (Tamil), తెలుగు (Telugu), and English**.

---

## 📁 Directory Structure

```
telegram_bot/
├── bot.py                  # Aiogram 3 bot & dispatcher setup with DB session management
├── runner.py               # Standalone bot startup script with DB initialization & event bus
├── states.py               # Aiogram FSM state definitions (Registration, Triage, Booking, Queue)
├── keyboards.py            # Multilingual inline & reply keyboards (Menu, Slots, Gender, Booking)
├── i18n.py                 # 5-Language localization dictionaries & translation helpers
├── database.py             # SQLite+aiosqlite async database engine & session maker
├── config.py               # Pydantic Settings configuration loader
├── .env                    # Environment variables & API credentials
├── requirements.txt        # Python dependencies for the bot
├── README.md               # Documentation & setup guide
│
├── handlers/               # Aiogram Router Handlers
│   ├── start.py            # /start command & language onboarding
│   ├── language.py         # Language preference switching & /language command
│   ├── registration.py     # Interactive patient registration (Name, Age, Gender, Phone, Location)
│   ├── triage.py           # AI Clinical Triage Gatekeeper & Health Advice
│   ├── appointments.py     # Interactive facility & doctor appointment booking
│   ├── queue.py            # Active token status, live queue positioning & check-in
│   ├── records.py          # Patient consultation history
│   └── notifications.py    # Telegram push notification helpers
│
├── services/               # Backend Business Logic & Integrations
│   ├── triage_service.py   # Clinical severity classifier, red flag regex, health advice
│   ├── queue_service.py    # Queue token numbering (TKN-YYYYMMDD-001) & advancing
│   ├── user_linking_service.py # Bridges Telegram Chat IDs with Users & Patients
│   ├── event_bus.py        # Asynchronous event bus for real-time notifications
│   ├── channel_notifier.py # Event listeners that dispatch Telegram alerts
│   ├── translation_service.py # Bhashini & LLM translation providers
│   └── notification_service.py # Telegram messaging utilities
│
├── models/                 # SQLAlchemy 2.0 Database Models
│   ├── user.py             # User model with telegram_chat_id & preferred_language
│   ├── patient.py          # Patient demographics & medical relations
│   ├── doctor.py           # Doctor profiles, specializations, facility links
│   ├── facility.py         # Hospital & clinic records
│   ├── appointment.py      # Scheduled & walk-in appointments
│   ├── queue_token.py      # Live queue tokens, positions, wait times
│   └── triage_session.py   # Historical triage session logs
│
└── schemas/                # Pydantic Data Validation Schemas
    ├── triage.py           # Triage assessment, urgency levels, symptom input
    ├── appointment.py      # Booking request & response schemas
    └── facility.py         # Facility availability schemas
```

---

## 🚀 How to Run the Telegram Bot

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables (`.env`)
Ensure your `.env` file contains:
```env
TELEGRAM_BOT_TOKEN=8959947643:AAF1iymbGxNyYAfM5OvP96NIOgVNoGX5Ex4
DATABASE_URL=sqlite+aiosqlite:///./sehat.db
DATABASE_URL_SYNC=sqlite:///./sehat.db
OPENAI_API_KEY=your-openai-key
BHASHINI_USER_ID=47f0e18310-635c-47c8-bfc3-7ee49b54e4ce
BHASHINI_API_KEY=Ha1Pyj-DXVGJwcn_DsFcsm_RvscXpULG0iHO_idpm3hHBkS_OD06QUnADMkWd6yl
```

### 3. Start the Bot
```bash
python -m runner
```
*(Or `python runner.py`)*

---

## 🔗 Git Integration with Your Teammates
To copy and include this in your project repository:
1. Copy the entire `telegram_bot` folder into your main project root.
2. Commit and push to your git branch:
   ```bash
   git add telegram_bot/
   git commit -m "feat: Add multilingual AI Telegram Bot with clinical triage & queue booking"
   git push origin main
   ```
