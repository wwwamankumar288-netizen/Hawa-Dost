"""
Gemini AI Service — Core GenAI integration for Hawa Dost.
Handles: Chat, Function Calling, Structured Output, Streaming, Vision, Embeddings.
"""
import os
import json
import asyncio
from pathlib import Path
from typing import AsyncGenerator, Optional, List

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Safety settings — relaxed for health/pollution advice context
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

# Load system prompt
SYSTEM_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "system_prompt.txt"
SYSTEM_PROMPT = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")

# ─── Function Declarations (Tools for Gemini Function Calling) ───────────────

AQI_TOOL = genai.protos.Tool(
    function_declarations=[
        genai.protos.FunctionDeclaration(
            name="get_current_aqi",
            description="Get real-time Air Quality Index (AQI) data for a geographic location. Use this whenever the user asks about current air quality, whether it's safe to go outside, or pollution levels.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "lat": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Latitude"),
                    "lon": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Longitude"),
                    "city": genai.protos.Schema(type=genai.protos.Type.STRING, description="City name as fallback"),
                },
                required=["city"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="get_weather",
            description="Get current weather conditions including temperature, humidity, and wind speed. Temperature inversions (warm air above cold air) trap smog and worsen AQI.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "lat": genai.protos.Schema(type=genai.protos.Type.NUMBER),
                    "lon": genai.protos.Schema(type=genai.protos.Type.NUMBER),
                    "city": genai.protos.Schema(type=genai.protos.Type.STRING),
                },
                required=["city"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="search_knowledge_base",
            description="Search the verified knowledge base for indoor air quality hacks, pollution tips, WHO guidelines, and sustainable alternatives. Use for specific advice questions.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "query": genai.protos.Schema(type=genai.protos.Type.STRING, description="Search query"),
                    "category": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="Category: indoor_hacks, sustainable_alternatives, health_effects, smog_science",
                    ),
                    "top_k": genai.protos.Schema(type=genai.protos.Type.INTEGER, description="Number of results, default 3"),
                },
                required=["query"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="calculate_emission_impact",
            description="Calculate CO2 emissions and health impact of a specific activity or lifestyle choice.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "activity": genai.protos.Schema(type=genai.protos.Type.STRING, description="Activity to analyze"),
                    "duration_hours": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Hours per day"),
                    "frequency": genai.protos.Schema(type=genai.protos.Type.STRING, description="daily, weekly, monthly"),
                },
                required=["activity"],
            ),
        ),
    ]
)


class GeminiService:
    """Core Gemini AI service for Hawa Dost."""

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
            tools=[AQI_TOOL],
            safety_settings=SAFETY_SETTINGS,
        )
        self.structured_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            safety_settings=SAFETY_SETTINGS,
        )
        self.vision_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            safety_settings=SAFETY_SETTINGS,
        )
        self.embedding_model = "models/text-embedding-004"

    async def stream_chat(
        self,
        message: str,
        history: List[dict],
        context: Optional[dict] = None,
        tool_handler=None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat response with function calling support."""

        # Build enriched message with context
        enriched_message = message
        if context:
            ctx_parts = []
            if context.get("aqi"):
                ctx_parts.append(f"[Current AQI: {context['aqi']} in {context.get('location', 'user location')}]")
            if context.get("profile"):
                p = context["profile"]
                ctx_parts.append(
                    f"[Family: {p.get('family_size', 4)} members, "
                    f"children: {p.get('children', 0)}, "
                    f"home: {p.get('home_type', 'apartment')}, "
                    f"commute: {p.get('commute_method', 'unknown')}]"
                )
            if ctx_parts:
                enriched_message = " ".join(ctx_parts) + "\n\n" + message

        # Convert history format
        gemini_history = [
            {"role": msg["role"], "parts": [msg["content"]]}
            for msg in history
        ]

        chat = self.model.start_chat(history=gemini_history)

        # Send message
        response = await asyncio.to_thread(
            chat.send_message,
            enriched_message,
            stream=True,
        )

        # Handle function calls and stream text
        for chunk in response:
            if chunk.candidates:
                for part in chunk.candidates[0].content.parts:
                    if hasattr(part, "function_call") and part.function_call:
                        fc = part.function_call
                        if tool_handler:
                            tool_result = await tool_handler(fc.name, dict(fc.args))
                            # Send function result back
                            fn_response = await asyncio.to_thread(
                                chat.send_message,
                                genai.protos.Content(
                                    parts=[
                                        genai.protos.Part(
                                            function_response=genai.protos.FunctionResponse(
                                                name=fc.name,
                                                response={"result": tool_result},
                                            )
                                        )
                                    ]
                                ),
                                stream=True,
                            )
                            for fn_chunk in fn_response:
                                if fn_chunk.text:
                                    yield fn_chunk.text
                    elif hasattr(part, "text") and part.text:
                        yield part.text

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_structured(self, prompt: str, response_schema: dict) -> dict:
        """Generate structured JSON output using Gemini."""
        full_prompt = f"""
{prompt}

IMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanation outside JSON.
Schema: {json.dumps(response_schema, indent=2)}
"""
        response = await asyncio.to_thread(
            self.structured_model.generate_content,
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback: extract JSON from response
            text = response.text
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end])

    async def analyze_image(self, image_bytes: bytes, prompt: str) -> str:
        """Analyze a home/environment image for air quality recommendations."""
        import PIL.Image
        import io

        image = PIL.Image.open(io.BytesIO(image_bytes))
        response = await asyncio.to_thread(
            self.vision_model.generate_content,
            [
                f"""You are Hawa Dost analyzing a home/environment photo to give indoor air quality advice.
                
{prompt}

Look for: ventilation points, cooking area, windows, plants, dust sources, heating appliances, 
carpets/curtains that trap particles, potential DIY air purifier spots.

Give 3-5 specific, actionable indoor air quality improvements you can see from this image.
Be specific about locations in the image.""",
                image,
            ],
            generation_config=genai.types.GenerationConfig(temperature=0.4),
        )
        return response.text

    async def get_embedding(self, text: str) -> List[float]:
        """Get text embedding for RAG."""
        result = await asyncio.to_thread(
            genai.embed_content,
            model=self.embedding_model,
            content=text,
            task_type="retrieval_query",
        )
        return result["embedding"]

    async def get_document_embedding(self, text: str) -> List[float]:
        """Get document embedding for RAG indexing."""
        result = await asyncio.to_thread(
            genai.embed_content,
            model=self.embedding_model,
            content=text,
            task_type="retrieval_document",
        )
        return result["embedding"]

