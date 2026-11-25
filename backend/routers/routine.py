"""
Routine Router — AI-generated personalized low-emission daily schedules.
"""
import json
from pathlib import Path
from fastapi import APIRouter
from services.gemini_service import GeminiService
from services.aqi_service import AQIService
from models.schemas import RoutineRequest, DailyRoutine

router = APIRouter()
gemini = GeminiService()
aqi_service = AQIService()

ROUTINE_PROMPT = (Path(__file__).parent.parent / "prompts" / "routine_prompt.txt").read_text()

ROUTINE_SCHEMA = {
    "type": "object",
    "properties": {
        "routine": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "time": {"type": "string"},
                    "activity": {"type": "string"},
                    "emission_level": {"type": "string", "enum": ["low", "medium", "high"]},
                    "health_risk": {"type": "string", "enum": ["safe", "caution", "avoid"]},
                    "alternative": {"type": "string"},
                    "impact_note": {"type": "string"},
                    "icon": {"type": "string"},
                },
            },
        },
        "daily_summary": {"type": "string"},
        "co2_saved_kg": {"type": "number"},
        "aqi_exposure_avoided_hours": {"type": "integer"},
    },
}


@router.post("/generate")
async def generate_routine(body: RoutineRequest):
    """Generate a personalized low-emission daily routine."""
    profile = body.profile

    # Fetch live AQI
    aqi_data = await aqi_service.get_aqi_by_city(profile.location)
    aqi = aqi_data["aqi"]
    aqi_category = aqi_data["category"]
    cigarette_equivalent = aqi_data["cigarette_equivalent"]

    # Format prompt
    prompt = ROUTINE_PROMPT.format(
        location=profile.location,
        aqi=aqi,
        aqi_category=aqi_category,
        family_size=profile.family_size,
        children=profile.children,
        elderly=profile.elderly,
        pregnant="Yes" if profile.pregnant else "No",
        home_type=profile.home_type.value,
        cooking_fuel=profile.cooking_fuel.value,
        commute_method=profile.commute_method.value,
        distance=profile.distance_km,
        budget=profile.budget,
        cigarette_equivalent=cigarette_equivalent,
    )

    result = await gemini.generate_structured(prompt, ROUTINE_SCHEMA)
    result["aqi_context"] = {
        "aqi": aqi,
        "category": aqi_category,
        "color": aqi_data["color"],
        "outdoor_safe": aqi_data["outdoor_safe"],
    }
    return result

