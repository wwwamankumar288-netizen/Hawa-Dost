"""
RAG Service — ChromaDB + Gemini Embeddings for knowledge retrieval.
Indexes the local knowledge base and retrieves relevant passages for Hawa Dost.
"""
import os
import asyncio
from pathlib import Path
from typing import List, Optional

import chromadb
from chromadb.config import Settings

import google.generativeai as genai


KNOWLEDGE_BASE_DIR = Path(__file__).parent.parent / "knowledge_base"

COLLECTION_NAME = "hawa_dost_knowledge"


class RAGService:
    """ChromaDB-backed RAG with Gemini text-embedding-004."""

    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.chroma_client = chromadb.Client(
            Settings(
                persist_directory=str(Path(__file__).parent.parent / "chroma_db"),
                anonymized_telemetry=False,
            )
        )
        self.collection = None

    async def initialize(self):
        """Load or create the knowledge base collection."""
        try:
            self.collection = self.chroma_client.get_collection(COLLECTION_NAME)
            print(f"✅ Loaded existing RAG collection ({self.collection.count()} docs)")
        except Exception:
            self.collection = self.chroma_client.create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            await self._ingest_knowledge_base()

    async def _ingest_knowledge_base(self):
        """Read and embed all knowledge base files."""
        docs, ids, metas = [], [], []

        for kb_file in KNOWLEDGE_BASE_DIR.glob("*.txt"):
            text = kb_file.read_text(encoding="utf-8")
            # Split into ~500 char chunks with 50 char overlap
            chunks = self._chunk_text(text, chunk_size=500, overlap=50)
            category = kb_file.stem  # filename without extension

            for i, chunk in enumerate(chunks):
                docs.append(chunk)
                ids.append(f"{kb_file.stem}_{i}")
                metas.append({"category": category, "source": kb_file.name})

        if not docs:
            print("⚠️  No knowledge base files found. RAG will be limited.")
            return

        # Embed in batches of 20
        all_embeddings = []
        for i in range(0, len(docs), 20):
            batch = docs[i : i + 20]
            embeddings = await self._embed_batch(batch)
            all_embeddings.extend(embeddings)

        self.collection.add(
            documents=docs,
            embeddings=all_embeddings,
            ids=ids,
            metadatas=metas,
        )
        print(f"✅ Ingested {len(docs)} knowledge chunks into RAG")

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Simple sliding window chunker."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end].strip())
            start += chunk_size - overlap
        return [c for c in chunks if len(c) > 50]

    async def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of texts using Gemini."""
        result = await asyncio.to_thread(
            genai.embed_content,
            model="models/text-embedding-004",
            content=texts,
            task_type="retrieval_document",
        )
        return result["embedding"]

    async def search(
        self,
        query: str,
        top_k: int = 3,
        category: Optional[str] = None,
    ) -> List[dict]:
        """Search knowledge base for relevant passages."""
        if self.collection is None or self.collection.count() == 0:
            return [{"text": "Knowledge base not loaded.", "category": "error", "relevance": 0}]

        # Embed query
        query_result = await asyncio.to_thread(
            genai.embed_content,
            model="models/text-embedding-004",
            content=query,
            task_type="retrieval_query",
        )
        query_embedding = query_result["embedding"]

        where = {"category": category} if category else None

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self.collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        formatted = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            formatted.append({
                "text": doc,
                "category": meta.get("category", "general"),
                "source": meta.get("source", ""),
                "relevance": round(1 - dist, 3),
            })
        return formatted

    def format_for_prompt(self, results: List[dict]) -> str:
        """Format RAG results as context for Gemini prompt."""
        if not results:
            return ""
        parts = ["=== Relevant Knowledge ==="]
        for r in results:
            parts.append(f"[{r['category']}] {r['text']}")
        return "\n\n".join(parts)

