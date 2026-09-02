# Triage — Smart e-Health Access & Triage Platform

A resilient, multilingual, low-bandwidth healthcare routing and OPD triage ecosystem connecting rural and underserved patients to doctors, clinics, pharmacies, and emergency services. Designed to operate seamlessly across high-latency environments, offline situations, and zero-data Telegram fallbacks.

---

##  Executive Summary

Rural and tier-2/3 healthcare systems frequently suffer from overcrowding, lack of triaging, language barriers, and intermittent network connectivity. **Triage+ (SeHAT)** resolves this by unifying:
1. **AI-Driven Clinical Triage**: Multilingual symptom assessment classifying urgency (`EMERGENCY`, `URGENT`, `ROUTINE`) and providing actionable medical next-steps.
2. **Real-Time Doctor Station & OPD Queue**: Live sequential token generation, real-time wait estimations, patient advancement, and consultation encounter notes.
3. **Zero-Data Telegram Bot Access**: Full bot fallback (`@TriageSmartBot`) allowing patients to triage symptoms, locate nearby live hospitals, book appointments, and track OPD token positions via Telegram.
4. **Live OpenStreetMap Healthcare Locator**: Real-time geolocation discovery of nearby hospitals, bed availability, and specialty doctors without requiring expensive proprietary map APIs.
5. **Offline-First PWA Architecture**: Built with IndexedDB/Dexie.js and Service Workers to queue actions offline and synchronize upon reconnection.
6. **Animated Ambulance Loading Screen**: Immersive realistic SVG vector ambulance loading experience with stage-by-stage diagnostic status and skip-on-tap support.

---

##  Architecture & Component Flow

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                            USER CHANNELS                               │
   │                                                                        │
   │   ┌───────────────────────────────┐    ┌───────────────────────────┐   │
   │   │   React 18 PWA (Web Client)   │    │ Telegram Bot (Zero-Data)  │   │
   │   │   • Offline Sync (Dexie.js)   │    │ • Symptom Triage          │   │
   │   │   • Ambulance Intro Loading   │    │ • Live Hospital Discovery │   │
   │   │   • Live Doctor Queue UI      │    │ • Instant Token & OPD Sync│   │
   │   └───────────────┬───────────────┘    └─────────────┬─────────────┘   │
   └───────────────────┼──────────────────────────────────┼─────────────────┘
                       │                                  │
                       │ REST APIs & WebSockets           │ Long Polling / Webhook
                       ▼                                  ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       FASTAPI BACKEND ENGINE                           │
   │                                                                        │
   │   ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────┐   │
   │   │ AI Triage & Advisory  │  │  Live Queue Manager   │  │ EventBus │   │
   │   │ (Groq / OpenAI / LLM) │  │  (Token & Wait ETA)   │  │ Channels │   │
   │   └───────────────────────┘  └───────────────────────┘  └──────────┘   │
   │   ┌───────────────────────┐  ┌───────────────────────┐                 │
   │   │ OSM / Hospital Engine │  │ Multilingual Parser   │                 │
   │   │ (Nominatim Discovery) │  │ (Bhashini / Indic TTS)│                 │
   │   └───────────────────────┘  └───────────────────────┘                 │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                           DATA STORAGE                                 │
   │                                                                        │
   │   • SQLite / PostgreSQL Database (Users, Appointments, Tokens, Beds)   │
   │   • In-Memory / Redis FSM Storage for Telegram Bot State Machine       │
   └────────────────────────────────────────────────────────────────────────┘
```

---

##  Core Features

### 1. Zero-Data Telegram Bot Integration (`@TriageSmartBot`)
- **Multilingual Support**: English, Hindi, Marathi, Tamil, and Telugu.
- **Symptom Triage**: Send text or voice note symptoms; receives clinical summary, urgency level, and self-care remedies.
- **Dynamic Hospital Discovery**: Geocodes city/area names or user GPS pins to query live operational hospitals via OpenStreetMap.
- **Live OPD Queue Booking**: Automatically generates sequential tokens (`TKN-YYYYMMDD-XXX`) and updates the patient as queue advances.

### 2.  Clinician & Doctor Dashboard (`/doctor/dashboard`)
- **Active Queue Tab**: Displays live sequence of waiting patients with urgent triage tags, estimated wait times, and channel badges (`📱 Telegram` vs `🌐 Web`).
- **Telegram Triage Feed Tab**: Real-time feed of symptom queries sent by Telegram patients with raw symptoms, AI assessment, and language.
- **One-Click Call & Advance**: Call next patient, mark encounters as completed, and auto-notify remaining patients in line.
- **Consultation Suite**: Direct transition into video, voice, or chat consultation with clinical notes and e-prescription generator.

### 3.  Ambulance Loading Screen
- Animated realistic SVG ambulance with flashing emergency beacons (red/blue), revolving wheels, speed trails, and hospital scenery.
- 5 diagnostic status messages indicating subsystem readiness.
- Runs exclusively on initial application start per session (stored via `sessionStorage`).
- Tap anywhere to immediately skip directly to login.

### 4.  Facility & Resource Management
- Real-time bed occupancy tracker across General Wards, ICU, Emergency, and NICU.
- Essential pharmacy and medicine inventory tracking with automatic low-stock alerts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6 |
| **Offline Storage** | Dexie.js (IndexedDB wrapper), Workbox Service Worker |
| **Backend Framework**| Python 3.12+, FastAPI, SQLAlchemy 2.0 (Asyncio), Pydantic v2 |
| **Telegram Engine** | aiogram 3 (FSM with MemoryStorage fallback) |
| **Database** | SQLite (`sqlite+aiosqlite`) / PostgreSQL |
| **Hospital Locator** | OpenStreetMap Nominatim Geocoding API |
| **AI / Triage** | Groq / OpenAI API / Rule-based Clinical Fallback Engine |
| **State Management** | Zustand |

---

##  Demo Credentials

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Doctor** | `doctor@demo.com` | `demo1234` | `/doctor/dashboard`, `/doctor/queue` |
| **Patient** | `patient@demo.com` | `demo1234` | `/dashboard`, `/triage`, `/appointments` |
| **Facility Admin**| `admin@demo.com` | `demo1234` | `/facility/dashboard`, `/facility/beds`, `/facility/medicines` |

---

##  Environment Configuration (`.env`)

Create a `.env` file in both root and `backend/`:

```env
# Database Configuration (SQLite default)
DATABASE_URL=sqlite+aiosqlite:///sehat.db
DATABASE_URL_SYNC=sqlite:///sehat.db

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# JWT Authentication
JWT_SECRET_KEY=sehat-hackathon-super-secret-key-32-chars-minimum-demo
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI / LLM Configuration
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# App & CORS
APP_NAME=Triage+
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

---

##  Step-by-Step Setup & Running Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.12.0 or higher
- **Git**: Installed and configured

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt aiosqlite email-validator

# Seed database with demo facilities, doctors, patients, and inventory
python -m app.seed.seed_data

# Start FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be accessible at:
- **Base API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/health`

---

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

Frontend will be accessible at:
- **Web Application**: `http://localhost:5173`

---

### 4. Running the Telegram Bot Runner

```bash
# From the backend directory with virtual environment activated:
cd backend
python -m app.bot.runner
```

Bot will connect via long-polling:
- Message **[@TriageSmartBot](https://t.me/TriageSmartBot)** with `/start`.

---

##  REST API Reference

###  Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register a new patient, doctor, or facility admin account.
- `POST /api/v1/auth/login` — Login and receive JWT bearer access and refresh tokens.
- `GET /api/v1/auth/me` — Retrieve the currently authenticated user profile.

###  Triage Assessment (`/api/v1/triage`)
- `POST /api/v1/triage/assess` — Process symptoms with AI, generate urgency classification, advisory, and fetch nearby matching facilities.
- `GET /api/v1/triage/history` — Get list of all real-time triage sessions across Web and Telegram channels.

###  Appointments (`/api/v1/appointments`)
- `GET /api/v1/appointments` — Fetch appointments (sorted newest-first, enriched with patient names, queue tokens, and Telegram channel flags).
- `POST /api/v1/appointments` — Book a new appointment and generate sequential queue token.
- `GET /api/v1/appointments/{id}` — Get single appointment details.
- `PATCH /api/v1/appointments/{id}` — Update appointment status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) and clinical notes.

###  Queue Management (`/api/v1/queue`)
- `GET /api/v1/queue/my-tokens` — Retrieve queue tokens for patient view.
- `POST /api/v1/queue/advance` — Advance doctor queue by 1, mark current patient completed, and re-calculate ETA for remaining patients.
- `POST /api/v1/queue/{token_id}/complete` — Mark specific token completed.

###  Facilities & Resources (`/api/v1/facilities`)
- `GET /api/v1/facilities` — List all facilities and clinics.
- `GET /api/v1/facilities/{id}/beds` — View live bed status (Available, Occupied, Cleaning).
- `GET /api/v1/facilities/{id}/medicines` — Pharmacy stock and essential inventory list.

---

##  Telegram Bot Command Flows

| Command / Action | Description |
|---|---|
| `/start` | Reset state, display multilingual welcome menu (English, Hindi, Marathi, Tamil, Telugu). |
| ` Start AI Triage` | Prompt user for symptoms via voice note or text message; returns urgency and clinical summary. |
| ` Nearby Hospitals` | Select a major city or share GPS pin / custom area name to query nearby live hospitals. |
| ` Book Appointment`| Select hospital, choose attending doctor, pick a time slot, and confirm OPD booking. |
| ` My Queue Token` | View live queue position, estimated wait time, and hospital instructions. |
| ` Emergency (108)` | Instant emergency dispatch guidance and toll-free helpline connection. |

---

##  Project Structure

```
Triage-main/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── appointments.py       # Appointment CRUD & enriched queue data
│   │   │   │   ├── auth.py               # JWT authentication & registration
│   │   │   │   ├── doctors.py            # Clinician availability endpoints
│   │   │   │   ├── facilities.py         # Hospital resource endpoints
│   │   │   │   ├── queue.py              # Live OPD queue advancement & tokens
│   │   │   │   └── triage.py             # AI symptom assessment & history
│   │   │   └── router.py                 # API v1 route aggregator
│   │   ├── bot/
│   │   │   ├── handlers/
│   │   │   │   ├── appointments.py       # Hospital discovery & slot booking
│   │   │   │   ├── language.py           # Language selection handler
│   │   │   │   ├── queue.py              # Token tracking & check-in
│   │   │   │   ├── start.py              # /start welcome handler
│   │   │   │   └── triage.py             # Voice/text symptom triage
│   │   │   ├── bot.py                    # Dispatcher & MemoryStorage setup
│   │   │   ├── keyboards.py              # Inline and reply keyboard builders
│   │   │   └── runner.py                 # Standalone long-polling bot runner
│   │   ├── models/                       # SQLAlchemy ORM models
│   │   │   ├── appointment.py
│   │   │   ├── bed.py
│   │   │   ├── doctor.py
│   │   │   ├── facility.py
│   │   │   ├── medicine.py
│   │   │   ├── patient.py
│   │   │   ├── queue_token.py
│   │   │   ├── triage_session.py
│   │   │   └── user.py
│   │   ├── schemas/                      # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── hospital_discovery_service.py # OpenStreetMap integration
│   │   │   ├── queue_service.py              # Token generation & queue logic
│   │   │   ├── triage_service.py             # Clinical urgency & LLM evaluator
│   │   │   └── user_linking_service.py       # Telegram chat_id to patient mapper
│   │   ├── config.py                     # App configuration & environment loader
│   │   ├── database.py                   # Async SQLAlchemy engine & session maker
│   │   └── main.py                       # FastAPI application entrypoint
│   └── requirements.txt                  # Python package specifications
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── AmbulanceLoadingScreen.tsx # Animated ambulance intro page
│   │   │       └── Navbar.tsx                 # Responsive app navigation bar
│   │   ├── pages/
│   │   │   ├── auth/                     # Login & Register views
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorDashboard.tsx   # Live OPD Queue & Telegram Feed
│   │   │   │   └── PatientQueuePage.tsx  # Dedicated queue controller
│   │   │   ├── facility/                 # Bed & Medicine management views
│   │   │   └── patient/                  # Triage, Booking, Records, & Consult views
│   │   ├── api/                          # Axios API clients
│   │   ├── stores/                       # Zustand authentication & state stores
│   │   ├── App.tsx                       # Main route registry & intro screen controller
│   │   └── main.tsx                      # React root mounting
│   ├── package.json                      # Node.js dependencies & scripts
│   └── vite.config.ts                    # Vite build & PWA plugin config
└── README.md                             # Project documentation
```

##  Live Deployments & Demo Links

| Service | Platform | Live URL / Handle | Status |
|---|---|---|---|
| **Web Application (PWA)** | **Vercel** | `https://triage-black-nu.vercel.app/` | 🟢 Online |
| **Backend REST API** | **Render** | `https://triage-backend-4moo.onrender.com` | 🟢 Online |
| **Interactive API Docs** | **Render (Swagger)** | `https://triage-backend-4moo.onrender.com/docs` | 🟢 Online |
| **Zero-Data Telegram Bot** | **Telegram** | [@TriageSmartBot](https://t.me/TriageSmartBot) | 🟢 Active 24/7 |

 Demo Credentials for Live Testing
Use these pre-seeded accounts to explore the portals:

 Clinician / Doctor Station:

Email: doctor@demo.com
Password: demo1234
Direct Access: /doctor/dashboard (Live OPD queue & Telegram triage stream)
 Patient Portal:

Email: patient@demo.com
Password: demo1234
Direct Access: /dashboard (Symptom check, doctor booking, prescriptions)
 Facility Admin:

Email: admin@demo.com
Password: demo1234
Direct Access: /facility/dashboard (Bed occupancy & medicine inventory)


 Live Verification & Testing Flow
Open the Doctor Station on your browser (/doctor/dashboard) using doctor@demo.com.
Open Telegram and message @TriageSmartBot:
Send /start and select your language.
Tap " Start AI Triage" and type your symptoms (e.g. "High fever and difficulty breathing").
Watch the Doctor Station:
The symptom report immediately appears under the Telegram Triage Feed tab.
An OPD appointment token is created on the Active Queue with urgency markers.
The doctor can click "Start Consult" or "Call Next Patient" to advance the queue in real-time.

---

## ☁️ 100% Free Production Deployment Architecture

The system is engineered to run completely free on cloud infrastructure without requiring paid server tiers or separate worker instances.

##  License & Acknowledgments

- **License**: MIT Open Source License.
- **Data Sources**: OpenStreetMap / Nominatim contributors.
- Built for accessible, smart, and equitable e-healthcare in underserved communities.
