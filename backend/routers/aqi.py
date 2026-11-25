"""
AQI Router — Real-time air quality endpoints.
"""
from fastapi import APIRouter, Query
from services.aqi_service import AQIService
from models.schemas import AQIData

router = APIRouter()
aqi_service = AQIService()

@router.get("/city/{city}", response_model=AQIData)
async def get_aqi_by_city(city: str):
    """Get AQI for a city name."""
    return await aqi_service.get_aqi_by_city(city)

@router.get("/coords")
async def get_aqi_by_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Get AQI by GPS coordinates."""
    return await aqi_service.get_aqi_by_coords(lat, lon)

@router.get("/weather/{city}")
async def get_weather(city: str):
    """Get weather + smog-trap conditions."""
    return await aqi_service.get_weather(city)

@router.get("/popular-cities")
async def get_popular_cities():
    """Pre-fetch AQI for top polluted South Asian cities."""
    cities = ["Delhi", "Lahore", "Dhaka", "Mumbai", "Kolkata", "Karachi", "Lucknow", "Kanpur"]
    import asyncio
    results = await asyncio.gather(
        *[aqi_service.get_aqi_by_city(c) for c in cities],
        return_exceptions=True,
    )
    return [r for r in results if isinstance(r, dict)]

