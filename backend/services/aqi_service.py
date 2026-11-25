"""
AQI Service — Real-time air quality data from WAQI and OpenWeatherMap.
"""
import os
import math
import asyncio
from datetime import datetime
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential


AQI_CATEGORIES = [
    (50,  "Good",       "#00e400", True,  False),
    (100, "Moderate",   "#ffff00", True,  False),
    (150, "Unhealthy for Sensitive Groups", "#ff7e00", True, True),
    (200, "Unhealthy",  "#ff0000", False, True),
    (300, "Very Unhealthy", "#8f3f97", False, True),
    (500, "Hazardous",  "#7e0023", False, True),
]

HEALTH_MESSAGES = {
    "Good":           "Air quality is satisfactory. Great day to be outdoors! 💚",
    "Moderate":       "Air is acceptable. Sensitive individuals should limit prolonged outdoor exertion.",
    "Unhealthy for Sensitive Groups": "Children, elderly, and those with respiratory issues should reduce outdoor time. ⚠️",
    "Unhealthy":      "Everyone may begin to experience health effects. Avoid outdoor exercise. Wear N95 mask. 😷",
    "Very Unhealthy": "Health alert! Serious risk for everyone. Stay indoors with windows closed. 🚨",
    "Hazardous":      "EMERGENCY: Extreme health risk. Do NOT go outside. Run air purifiers. Seek medical attention if breathing difficulties occur. 🆘",
}


def aqi_to_cigarettes(aqi: int) -> float:
    """Convert AQI to cigarette equivalent (Berkeley Earth formula: 22 µg/m³ PM2.5 ≈ 1 cigarette/day)."""
    # AQI 150 ≈ PM2.5 55.4 µg/m³ ≈ 2.5 cigarettes/day
    pm25_estimate = aqi * 0.37  # rough linear approximation for high AQI ranges
    return round(pm25_estimate / 22, 2)


def categorize_aqi(aqi: int):
    for threshold, category, color, outdoor_safe, mask in AQI_CATEGORIES:
        if aqi <= threshold:
            return category, color, outdoor_safe, mask
    return "Hazardous", "#7e0023", False, True


class AQIService:
    """Fetches and caches real-time AQI data."""

    def __init__(self):
        self.waqi_token = os.getenv("WAQI_API_TOKEN", "demo")
        self.owm_key = os.getenv("OPENWEATHER_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=10.0)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=5))
    async def get_aqi_by_city(self, city: str) -> dict:
        """Fetch AQI from WAQI API by city name."""
        url = f"https://api.waqi.info/feed/{city}/?token={self.waqi_token}"
        try:
            resp = await self.client.get(url)
            data = resp.json()
            if data.get("status") == "ok":
                return self._parse_waqi(data["data"], city)
        except Exception:
            pass
        return self._fallback_aqi(city)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=5))
    async def get_aqi_by_coords(self, lat: float, lon: float) -> dict:
        """Fetch AQI from WAQI API by coordinates."""
        url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={self.waqi_token}"
        try:
            resp = await self.client.get(url)
            data = resp.json()
            if data.get("status") == "ok":
                return self._parse_waqi(data["data"], f"{lat},{lon}")
        except Exception:
            pass
        return self._fallback_aqi("your location")

    def _parse_waqi(self, data: dict, location: str) -> dict:
        aqi = data.get("aqi", 0)
        if not isinstance(aqi, (int, float)):
            aqi = 0
        aqi = int(aqi)
        category, color, outdoor_safe, mask = categorize_aqi(aqi)
        iaqi = data.get("iaqi", {})
        city_info = data.get("city", {})
        city_name = city_info.get("name", location) if city_info else location

        return {
            "aqi": aqi,
            "category": category,
            "color": color,
            "pm25": iaqi.get("pm25", {}).get("v"),
            "pm10": iaqi.get("pm10", {}).get("v"),
            "no2": iaqi.get("no2", {}).get("v"),
            "co": iaqi.get("co", {}).get("v"),
            "o3": iaqi.get("o3", {}).get("v"),
            "location": location,
            "city": city_name,
            "timestamp": datetime.utcnow().isoformat(),
            "health_message": HEALTH_MESSAGES.get(category, ""),
            "cigarette_equivalent": aqi_to_cigarettes(aqi),
            "outdoor_safe": outdoor_safe,
            "mask_required": mask,
        }

    def _fallback_aqi(self, location: str) -> dict:
        """Return a fallback when API is unavailable."""
        return {
            "aqi": 0,
            "category": "Unknown",
            "color": "#cccccc",
            "pm25": None, "pm10": None, "no2": None, "co": None, "o3": None,
            "location": location,
            "city": location,
            "timestamp": datetime.utcnow().isoformat(),
            "health_message": "Could not fetch real-time AQI. Please check your API token.",
            "cigarette_equivalent": 0,
            "outdoor_safe": True,
            "mask_required": False,
        }

    async def get_weather(self, city: str, lat: Optional[float] = None, lon: Optional[float] = None) -> dict:
        """Fetch weather from OpenWeatherMap."""
        if not self.owm_key:
            return {"error": "OpenWeatherMap API key not configured"}
        try:
            if lat and lon:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.owm_key}&units=metric"
            else:
                url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={self.owm_key}&units=metric"
            resp = await self.client.get(url)
            data = resp.json()
            temp = data["main"]["temp"]
            humidity = data["main"]["humidity"]
            wind_speed = data["wind"]["speed"]
            description = data["weather"][0]["description"]

            # Temperature inversion risk: cold surface, warm aloft — calm winds trap smog
            inversion_risk = "High" if wind_speed < 2 and humidity > 70 else \
                             "Medium" if wind_speed < 5 else "Low"

            return {
                "temperature_c": temp,
                "humidity_percent": humidity,
                "wind_speed_ms": wind_speed,
                "description": description,
                "temperature_inversion_risk": inversion_risk,
                "smog_trap_warning": inversion_risk == "High",
            }
        except Exception as e:
            return {"error": str(e)}

    async def close(self):
        await self.client.aclose()

