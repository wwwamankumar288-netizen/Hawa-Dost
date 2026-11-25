"""
Pydantic models for Hawa Dost data schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from enum import Enum


class HomeType(str, Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    SHARED = "shared_accommodation"
    SLUM = "jhuggi_colony"


class CookingFuel(str, Enum):
    LPG = "lpg"
    CNG = "cng"
    ELECTRIC = "electric"
    BIOMASS = "biomass"
    KEROSENE = "kerosene"


class CommuteMethod(str, Enum):
    PERSONAL_CAR = "personal_car"
    MOTORCYCLE = "motorcycle"
    AUTO = "auto_rickshaw"
    BUS = "bus"
    METRO = "metro"
    CYCLE = "cycle"
    WALK = "walk"
    ERICKSHAW = "e_rickshaw"
    WFH = "work_from_home"


class FamilyProfile(BaseModel):
    location: str = Field(..., description="City or area name")
    lat: Optional[float] = None
    lon: Optional[float] = None
    family_size: int = Field(default=4, ge=1, le=20)
    children: int = Field(default=0, ge=0)
    elderly: int = Field(default=0, ge=0)
    pregnant: bool = False
    home_type: HomeType = HomeType.APARTMENT
    cooking_fuel: CookingFuel = CookingFuel.LPG
    commute_method: CommuteMethod = CommuteMethod.PERSONAL_CAR
    distance_km: float = Field(default=10.0, ge=0)
    budget: Literal["free", "low", "medium", "high"] = "low"
    language: Literal["en", "hi", "ur", "pa"] = "en"


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    profile: Optional[FamilyProfile] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    location: Optional[str] = None


class RoutineRequest(BaseModel):
    profile: FamilyProfile


class ImpactRequest(BaseModel):
    activity: str
    profile: Optional[FamilyProfile] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class IndoorRequest(BaseModel):
    home_type: HomeType
    budget: Literal["free", "low", "medium", "high"] = "free"
    num_rooms: int = Field(default=2, ge=1)
    has_children: bool = False
    has_elderly: bool = False
    location: Optional[str] = None


class AQIData(BaseModel):
    aqi: int
    category: str
    color: str
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    location: str
    city: str
    timestamp: str
    health_message: str
    cigarette_equivalent: float
    outdoor_safe: bool
    mask_required: bool


class RoutineItem(BaseModel):
    time: str
    activity: str
    emission_level: Literal["low", "medium", "high"]
    health_risk: Literal["safe", "caution", "avoid"]
    alternative: str
    impact_note: str
    icon: str


class DailyRoutine(BaseModel):
    routine: List[RoutineItem]
    daily_summary: str
    co2_saved_kg: float
    aqi_exposure_avoided_hours: int


class ImpactAlternative(BaseModel):
    name: str
    feasibility: int
    co2_saved_kg_per_year: float
    health_benefit: str
    monthly_cost_inr: int
    current_monthly_cost_inr: int
    availability: str
    first_step: str
    icon: str


class ImpactAnalysis(BaseModel):
    original_activity: str
    original_emission_kg_per_day: float
    original_health_risk: str
    alternatives: List[ImpactAlternative]
    community_impact: dict


class IndoorHack(BaseModel):
    title: str
    description: str
    cost: Literal["free", "low", "medium", "high"]
    cost_inr: str
    effectiveness: str
    steps: List[str]
    icon: str
    category: str


class TrackerEntry(BaseModel):
    date: str
    transport_choice: str
    cooking_fuel: str
    heating_method: Optional[str] = None
    outdoor_hours: float = 0
    mask_worn: bool = False


class ImpactSummary(BaseModel):
    total_co2_saved_kg: float
    aqi_exposure_avoided_hours: float
    equivalent_trees: float
    streak_days: int
    weekly_summary: str

