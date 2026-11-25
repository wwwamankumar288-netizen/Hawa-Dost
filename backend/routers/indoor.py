"""
Indoor Air Quality Router — Budget-based indoor hack recommendations via RAG.
"""
from fastapi import APIRouter, Request
from services.gemini_service import GeminiService
from models.schemas import IndoorRequest

router = APIRouter()
gemini = GeminiService()

INDOOR_SCHEMA = {
    "type": "object",
    "properties": {
        "hacks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "cost": {"type": "string", "enum": ["free", "low", "medium", "high"]},
                    "cost_inr": {"type": "string"},
                    "effectiveness": {"type": "string"},
                    "steps": {"type": "array", "items": {"type": "string"}},
                    "icon": {"type": "string"},
                    "category": {"type": "string"},
                },
            },
        },
        "priority_tip": {"type": "string"},
        "quick_wins": {"type": "array", "items": {"type": "string"}},
    },
}

BUDGET_FILTERS = {
    "free": "completely free, using items already at home",
    "low": "under ₹500 (about $6)",
    "medium": "under ₹2000 (about $24)",
    "high": "any budget including HEPA purifiers and smart sensors",
}


@router.post("/hacks")
async def get_indoor_hacks(request: Request, body: IndoorRequest):
    """Get personalized indoor air quality hacks based on home type and budget."""
    rag = request.app.state.rag

    # RAG search for relevant indoor techniques
    rag_results = await rag.search(
        query=f"indoor air quality {body.home_type.value} home",
        top_k=5,
        category="indoor_hacks",
    )
    rag_context = rag.format_for_prompt(rag_results)

    budget_desc = BUDGET_FILTERS.get(body.budget, "any budget")
    vulnerable = []
    if body.has_children:
        vulnerable.append("young children")
    if body.has_elderly:
        vulnerable.append("elderly members")
    vulnerable_str = " and ".join(vulnerable) if vulnerable else "healthy adults"

    prompt = f"""
{rag_context}

Based on the above verified knowledge, generate indoor air quality improvement hacks for:
- Home Type: {body.home_type.value} ({body.num_rooms} rooms)
- Budget: {budget_desc}
- Vulnerable family members: {vulnerable_str}
- Location context: {body.location or "South Asian urban area"}

Generate 6-8 practical hacks prioritized by effectiveness and cost. Include:
1. At least 3 completely FREE hacks
2. DIY solutions using common household items
3. Plant recommendations (rank by PM2.5 absorption)
4. Cooking/heating ventilation techniques
5. Window/door sealing for severe smog days

Each hack must have clear step-by-step instructions (3-5 steps max).
Return as JSON matching the schema provided.
"""
    result = await gemini.generate_structured(prompt, INDOOR_SCHEMA)
    return result


@router.get("/plants")
async def get_air_purifying_plants(request: Request):
    """Get ranked list of air-purifying plants for Indian homes."""
    rag = request.app.state.rag
    results = await rag.search("air purifying plants PM2.5 indoor India", top_k=4)
    context = rag.format_for_prompt(results)

    prompt = f"""
{context}

List the top 10 air-purifying plants best suited for Indian homes, ranked by PM2.5 absorption effectiveness.
For each plant include: name (Hindi name too), effectiveness rating (1-10), care difficulty, 
light requirement, water frequency, PM2.5 absorption µg/hr, and where to place it in home.
Return as JSON array.
"""
    return await gemini.generate_structured(prompt, {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "hindi_name": {"type": "string"},
                "pm25_absorption_rank": {"type": "integer"},
                "effectiveness": {"type": "integer"},
                "care_difficulty": {"type": "string"},
                "light_requirement": {"type": "string"},
                "water_frequency": {"type": "string"},
                "best_placement": {"type": "string"},
                "icon": {"type": "string"},
            },
        },
    })

