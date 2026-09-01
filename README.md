# 🏥 Triage+ (SeHAT) — Smart e-Health Access & Triage

A low-bandwidth, multilingual platform that connects rural and underserved patients to doctors, pharmacies, and healthcare facilities through one unified system — designed to work even with intermittent or no internet connectivity.

## 🌟 Key Features

- **AI-Assisted Triage**: Symptom assessment in patient's own language (voice or text) with urgency classification
- **Smart Routing**: Checks doctor availability + bed capacity + medicine stock together — recommends the facility that can actually treat you
- **Offline-First PWA**: Works without internet, syncs when connectivity returns
- **Telegram Bot Fallback**: Zero-data access for appointment booking and queue updates
- **Digital Queue Tokens**: No physical waiting — know your position and ETA remotely
- **Tiered Consultation**: Video → Voice → Chat, automatically adapts to bandwidth
- **Family Linking**: Family members can manage bookings for elderly or illiterate patients

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐
│  React PWA  │     │ Telegram Bot │
│ (Offline)   │     │ (Zero-Data)  │
└──────┬──────┘     └──────┬───────┘
       │    HTTPS / WSS    │
       └────────┬──────────┘
                │
       ┌────────▼────────┐
       │  FastAPI Backend │
       │  ┌────────────┐  │
       │  │ AI Triage   │  │
       │  │ Smart Route │  │
       │  │ Queue Mgmt  │  │
       │  │ WebSocket   │  │
       │  └────────────┘  │
       └────────┬─────────┘
                │
       ┌────────▼────────┐
       │   PostgreSQL    │
       │   (PostGIS)     │
       │   + Redis       │
       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **Docker & Docker Compose** (for PostgreSQL + Redis)

### 1. Clone & Setup Environment

```bash
# Copy environment config
cp .env.example .env
# Edit .env with your API keys (TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, etc.)
```

### 2. Start Database Services

```bash
docker-compose up -d
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed demo data
python -m app.seed.seed_data

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 5. Access the Application

- **PWA**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Telegram Bot**: Message your bot on Telegram

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | demo1234 |
| Doctor | doctor@demo.com | demo1234 |
| Facility Admin | admin@demo.com | demo1234 |

## 📁 Project Structure

```
Tria/
├── backend/           # FastAPI Backend
│   ├── app/
│   │   ├── api/       # REST API routes
│   │   ├── bot/       # Telegram bot (aiogram 3)
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── security/  # JWT, RBAC, auth
│   │   ├── services/  # Business logic
│   │   ├── websockets/# Real-time updates
│   │   └── seed/      # Demo data seeder
│   └── alembic/       # DB migrations
├── frontend/          # React PWA
│   └── src/
│       ├── pages/     # Page components
│       ├── components/# Reusable UI
│       ├── db/        # Dexie.js (offline)
│       ├── sync/      # Background sync
│       ├── sw/        # Service worker
│       ├── i18n/      # Translations
│       └── api/       # API client
└── docker-compose.yml
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Offline | Workbox 7, Dexie.js, IndexedDB |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 |
| Bot | aiogram 3, Telegram Bot API |
| Database | PostgreSQL 16 + PostGIS, Redis |
| AI | OpenAI/Anthropic API, Instructor, Pydantic |
| i18n | react-i18next, Bhashini API |


