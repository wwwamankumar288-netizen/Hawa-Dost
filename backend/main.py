"""
Hawa Dost Backend - FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv

from routers import chat, aqi, routine, impact, indoor, vision
from services.rag_service import RAGService

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    print("🌿 Hawa Dost starting up...")
    # Initialize RAG knowledge base
    rag = RAGService()
    await rag.initialize()
    app.state.rag = rag
    print("✅ RAG knowledge base loaded")
    yield
    print("🌿 Hawa Dost shutting down...")

app = FastAPI(
    title="Hawa Dost API",
    description="GenAI-powered air pollution assistant for families",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://hawa-dost.vercel.app",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(chat.router,      prefix="/api/chat",        tags=["Chat"])
app.include_router(aqi.router,       prefix="/api/aqi",         tags=["AQI"])
app.include_router(routine.router,   prefix="/api/routine",     tags=["Routine"])
app.include_router(impact.router,    prefix="/api/impact",      tags=["Impact"])
app.include_router(indoor.router,    prefix="/api/indoor",      tags=["Indoor"])
app.include_router(vision.router,    prefix="/api/vision",      tags=["Vision"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "Hawa Dost", "version": "1.0.0"}

