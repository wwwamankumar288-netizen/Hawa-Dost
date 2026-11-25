"""
Impact Router — Sustainable alternative analysis with CO2 and health metrics.
"""
from pathlib import Path
from fastapi import APIRouter
from services.gemini_service import GeminiService
from services.aqi_service import AQIService
from models.schemas import ImpactRequest

router = APIRouter()
gemini = GeminiService()
aqi_service = AQIService()

IMPACT_PROMPT = (Path(__file__).parent.parent / "prompts" / "impact_prompt.txt").read_text()

IMPACT_SCHEMA = {
    "type": "object",
    "properties": {
        "original_activity": {"type": "string"},
        "original_emission_kg_per_day": {"type": "number"},
        "original_health_risk": {"type": "string"},
        "alternatives": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "feasibility": {"type": "integer"},
                    "co2_saved_kg_per_year": {"type": "number"},
                    "health_benefit": {"type": "string"},
                    "monthly_cost_inr": {"type": "integer"},
                    "current_monthly_cost_inr": {"type": "integer"},
                    "availability": {"type": "string"},
                    "first_step": {"type": "string"},
                    "icon": {"type": "string"},
                },
            },
        },
        "community_impact": {"type": "object"},
    },
}


@router.post("/analyze")
async def analyze_impact(body: ImpactRequest):
    """Analyze the environmental and health impact of an activity."""
    aqi = 0
    location = "India"
    if body.lat and body.lon:
        aqi_data = await aqi_service.get_aqi_by_coords(body.lat, body.lon)
        aqi = aqi_data["aqi"]
        location = aqi_data["city"]
    elif body.profile:
        aqi_data = await aqi_service.get_aqi_by_city(body.profile.location)
        aqi = aqi_data["aqi"]
        location = body.profile.location

    profile_str = "general urban family"
    if body.profile:
        p = body.profile
        profile_str = f"{p.family_size}-member family in {p.location}, commutes by {p.commute_method.value}, cooks on {p.cooking_fuel.value}"

    prompt = IMPACT_PROMPT.format(
        activity=body.activity,
        location=location,
        family_profile=profile_str,
        aqi=aqi,
    )

    result = await gemini.generate_structured(prompt, IMPACT_SCHEMA)
    return result


@router.get("/quick/{activity}")
async def quick_impact(activity: str, location: str = "Delhi"):
    """Quick impact lookup for common activities."""
    aqi_data = await aqi_service.get_aqi_by_city(location)
    prompt = IMPACT_PROMPT.format(
        activity=activity,
        location=location,
        family_profile="average urban family",
        aqi=aqi_data["aqi"],
    )
    return await gemini.generate_structured(prompt, IMPACT_SCHEMA)

