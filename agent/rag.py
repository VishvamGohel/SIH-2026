"""
Local vector store for RAG: ingestion and retrieval over SOPs, manuals,
correspondence, and vision-derived document summaries + raw OCR text.

Uses Chroma with a persistent local directory (no network calls) and
the CPU-pinned nomic-embed-text model for embeddings.
"""

import json
import uuid
from pathlib import Path

import chromadb
import ollama

CONFIG_PATH = Path(__file__).parent.parent / "router" / "model_config.json"
DB_PATH = Path(__file__).parent / "chroma_store"

_client = None
_collection = None


def _load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(DB_PATH))
        _collection = _client.get_or_create_collection("documents")
    return _collection


def _embed_text(text: str) -> list[float]:
    config = _load_config()
    embedding_model = config["models"]["embedding"]["ollama_tag"]
    response = ollama.embeddings(model=embedding_model, prompt=text)
    return response["embedding"]


def ingest(text: str, metadata: dict) -> str:
    """
    Embed and store a chunk of text with metadata. Used both for plain
    document ingestion and for vision-derived output -- callers should
    ingest the structured summary and the raw OCR text as two separate
    calls, tagged via metadata["content_type"] (e.g. "summary" | "raw_ocr" | "document").
    """
    collection = _get_collection()
    doc_id = str(uuid.uuid4())
    embedding = _embed_text(text)
    collection.add(
        ids=[doc_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[metadata],
    )
    return doc_id


def retrieve(query: str, k: int = 5) -> list[dict]:
    """
    Return the top-k matching chunks for a query, each as
    {"text": str, "metadata": dict, "distance": float}.
    """
    collection = _get_collection()
    query_embedding = _embed_text(query)
    results = collection.query(query_embeddings=[query_embedding], n_results=k)

    hits = []
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    for text, metadata, distance in zip(documents, metadatas, distances):
        hits.append({"text": text, "metadata": metadata, "distance": distance})
    return hits
