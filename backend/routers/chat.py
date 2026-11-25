"""
Chat Router — Streaming conversational endpoint with Gemini function calling.
"""
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest
from services.gemini_service import GeminiService
from services.aqi_service import AQIService
from services.rag_service import RAGService

router = APIRouter()
gemini = GeminiService()
aqi_service = AQIService()


async def tool_handler(function_name: str, args: dict, request: Request) -> dict:
    """Handles Gemini function calls during chat."""
    rag: RAGService = request.app.state.rag

    if function_name == "get_current_aqi":
        city = args.get("city", "Delhi")
        lat = args.get("lat")
        lon = args.get("lon")
        if lat and lon:
            return await aqi_service.get_aqi_by_coords(lat, lon)
        return await aqi_service.get_aqi_by_city(city)

    elif function_name == "get_weather":
        city = args.get("city", "Delhi")
        return await aqi_service.get_weather(city, args.get("lat"), args.get("lon"))

    elif function_name == "search_knowledge_base":
        results = await rag.search(
            query=args.get("query", ""),
            top_k=args.get("top_k", 3),
            category=args.get("category"),
        )
        return {"results": results, "context": rag.format_for_prompt(results)}

    elif function_name == "calculate_emission_impact":
        activity = args.get("activity", "")
        duration = args.get("duration_hours", 1)
        # Simplified emission lookup table
        EMISSION_FACTORS = {
            "car_diesel": 0.21,  # kg CO2 per km
            "car_petrol": 0.18,
            "motorcycle": 0.12,
            "bus": 0.089,
            "metro": 0.041,
            "auto_rickshaw": 0.10,
            "cooking_lpg": 0.063,  # per hour
            "cooking_biomass": 0.60,
            "generator_diesel": 2.68,  # per hour
        }
        # Simple keyword match
        factor = 0.1
        for key, val in EMISSION_FACTORS.items():
            if any(word in activity.lower() for word in key.split("_")):
                factor = val
                break
        total = round(factor * duration, 3)
        return {
            "activity": activity,
            "co2_kg_per_occurrence": total,
            "co2_kg_per_year": round(total * 365, 1),
            "equivalent_trees_needed": round(total * 365 / 21.7, 1),
        }

    return {"error": f"Unknown function: {function_name}"}


@router.post("/stream")
async def chat_stream(request: Request, body: ChatRequest):
    """Streaming chat endpoint — Server-Sent Events."""

    context = {}
    if body.lat and body.lon:
        aqi_data = await aqi_service.get_aqi_by_coords(body.lat, body.lon)
        context["aqi"] = aqi_data["aqi"]
        context["location"] = aqi_data["city"]
    elif body.location:
        aqi_data = await aqi_service.get_aqi_by_city(body.location)
        context["aqi"] = aqi_data["aqi"]
        context["location"] = body.location

    if body.profile:
        context["profile"] = body.profile.model_dump()

    async def event_stream():
        async for chunk in gemini.stream_chat(
            message=body.message,
            history=[m.model_dump() for m in body.history],
            context=context,
            tool_handler=lambda name, args: tool_handler(name, args, request),
        ):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/message")
async def chat_message(request: Request, body: ChatRequest):
    """Non-streaming chat endpoint (for simple integrations)."""
    context = {}
    if body.location:
        aqi_data = await aqi_service.get_aqi_by_city(body.location)
        context["aqi"] = aqi_data["aqi"]
        context["location"] = body.location

    full_response = ""
    async for chunk in gemini.stream_chat(
        message=body.message,
        history=[m.model_dump() for m in body.history],
        context=context,
        tool_handler=lambda name, args: tool_handler(name, args, request),
    ):
        full_response += chunk

    return {"response": full_response, "context": context}

