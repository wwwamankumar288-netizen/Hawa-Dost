"""
Vision Router — Analyze home/environment photos for air quality recommendations.
"""
from fastapi import APIRouter, UploadFile, File, Form
from services.gemini_service import GeminiService

router = APIRouter()
gemini = GeminiService()


@router.post("/analyze-home")
async def analyze_home_photo(
    file: UploadFile = File(...),
    room_type: str = Form(default="living room"),
    location: str = Form(default=""),
):
    """
    Upload a photo of your room/home and get specific indoor air quality advice.
    Uses Gemini Vision to identify pollution sources and suggest improvements.
    """
    image_bytes = await file.read()

    prompt = f"""
This is a photo of a {room_type} in a home{' in ' + location if location else ''}.
Please analyze it for indoor air quality improvement opportunities.
Consider the current winter smog season context.
"""

    analysis = await gemini.analyze_image(image_bytes, prompt)
    return {
        "analysis": analysis,
        "room_type": room_type,
        "model_used": "gemini-2.0-flash-vision",
    }


@router.post("/analyze-outdoor")
async def analyze_outdoor_photo(
    file: UploadFile = File(...),
    location: str = Form(default=""),
):
    """
    Analyze an outdoor/street photo to assess visible pollution and give advice.
    """
    image_bytes = await file.read()

    prompt = f"""
This is an outdoor photo{' from ' + location if location else ''}.
Assess the visible air quality / smog level from this image.
Look for: haze, reduced visibility, smog layers, industrial smoke, traffic density, construction dust.
Give a visual AQI estimate and specific protective advice for people in this environment.
"""

    analysis = await gemini.analyze_image(image_bytes, prompt)
    return {
        "analysis": analysis,
        "location": location,
        "model_used": "gemini-2.0-flash-vision",
    }

