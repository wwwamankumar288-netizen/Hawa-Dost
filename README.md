# 🌿 Hawa Dost — हवा दोस्त

> **GenAI-powered air quality assistant helping families navigate winter smog and urban air pollution.**

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-orange)](https://ai.google.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)

---

## ✨ Features

| Feature | Description | AI Technology |
|---|---|---|
| 💬 **Hawa Dost Chatbot** | Multilingual (Hindi/Urdu/English) conversational AI | Gemini 2.0 Flash + Function Calling + Streaming |
| 📅 **Routine Builder** | Personalized low-emission daily schedules | Structured JSON output + Live AQI context |
| 🏡 **Indoor Hacks** | Budget-based indoor air quality improvements | RAG (ChromaDB + text-embedding-004) |
| 🌱 **Sustainable Alternatives** | CO₂/health impact of choices + local alternatives | Chain-of-thought reasoning |
| 📊 **Impact Tracker** | Family CO₂ savings with charts | Local storage + Recharts |
| 👁️ **Vision Analysis** | Analyze home photos for air quality advice | Gemini Vision API |

---

## 🏗️ Architecture

```
hawa-dost/
├── backend/              # FastAPI (Python 3.11)
│   ├── main.py          # App entry + CORS
│   ├── routers/         # chat, aqi, routine, impact, indoor, vision
│   ├── services/        # gemini_service, aqi_service, rag_service
│   ├── prompts/         # System, routine, impact prompts
│   └── knowledge_base/  # WHO guidelines, indoor hacks, smog science
│
└── frontend/             # Next.js 14 (TypeScript + Tailwind)
    ├── app/             # Pages: /, /chat, /routine, /indoor, /alternatives, /tracker
    └── components/      # AQICard, Navigation, QuickActions
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- API keys (see below)

### 1. Clone & Setup

```bash
cd hawa-dost
cp .env.example .env
# Edit .env with your API keys
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 4. Docker (Full Stack)

```bash
# From root hawa-dost/ directory
docker-compose up --build
```

---

## 🔑 API Keys Setup

| Key | Source | Free Tier |
|---|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) | ✅ Yes |
| `WAQI_API_TOKEN` | [aqicn.org/api](https://aqicn.org/api/) | ✅ Yes |
| `OPENWEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org/api) | ✅ Yes |
| `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) | Optional |

---

## 🧠 GenAI Tools Used

### 1. Gemini Chat with Function Calling
The chatbot uses `gemini-2.0-flash` with 4 live tools:
- `get_current_aqi` — fetches real-time AQI before every answer
- `get_weather` — checks temperature inversion risk
- `search_knowledge_base` — queries the RAG corpus
- `calculate_emission_impact` — computes CO₂ math

### 2. Streaming SSE
Chat responses stream token-by-token via Server-Sent Events for a real-time feel.

### 3. RAG with Gemini Embeddings
ChromaDB stores embeddings of:
- WHO Air Quality Guidelines 2021
- Indoor air quality hacks (scientific + practical)
- Sustainable alternatives for South Asian context
- Smog science explainers

Using `models/text-embedding-004` for both indexing and retrieval.

### 4. Structured Output
Routine Builder uses `response_mime_type="application/json"` for typed schedule output.

### 5. Gemini Vision
Photo upload analyzes home/outdoor environments for specific air quality recommendations.

### 6. Multilingual
System prompt instructs Gemini to auto-detect and respond in Hindi/Urdu/Punjabi/English.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/stream` | Streaming chat (SSE) |
| `GET` | `/api/aqi/city/{city}` | Live AQI for a city |
| `GET` | `/api/aqi/coords?lat=&lon=` | AQI by GPS |
| `GET` | `/api/aqi/popular-cities` | Pre-fetched major city AQI |
| `POST` | `/api/routine/generate` | Generate daily routine |
| `POST` | `/api/impact/analyze` | Sustainable alternatives analysis |
| `POST` | `/api/indoor/hacks` | Indoor air quality hacks |
| `GET` | `/api/indoor/plants` | Air-purifying plant rankings |
| `POST` | `/api/vision/analyze-home` | Vision: analyze home photo |
| `GET` | `/health` | Health check |

---

## 🌏 Supported Cities (WAQI)
Delhi, Mumbai, Kolkata, Chennai, Lahore, Dhaka, Karachi, Lucknow, Kanpur, Patna, and 1000+ more.

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Submit a PR with tests

---

## 📄 License
MIT — Free to use, modify, and share for air quality awareness.

---

*Built with 💚 to give every family the right to breathe clean air.*

