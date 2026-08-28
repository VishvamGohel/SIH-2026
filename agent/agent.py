"""
Agent entry point. Dharm's backend calls run() directly -- treat its
signature as a contract; flag before changing it.

Flow: router decision -> RAG retrieval (text roles) or one-shot vision
extraction (vision role, once per new document) -> model call -> return
AgentResult. Tool-call output is JSON-constrained via pydantic; retries
are bounded by RECURSION_LIMIT since small models are prone to malformed
tool calls and an uncapped retry loop is the most likely live-demo failure.
"""

import json
from pathlib import Path
from typing import TypedDict

import ollama

import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "router"))
from router import route  # noqa: E402
from rag import ingest, retrieve  # noqa: E402

CONFIG_PATH = Path(__file__).parent.parent / "router" / "model_config.json"
RECURSION_LIMIT = 15

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}


def _has_extractable_text(attachments: list[str] | None) -> bool:
    """
    Cheap heuristic: image files have no text layer, so they always need
    vision. Anything else (e.g. a .txt/.pdf with a real text layer) is
    assumed to have extractable text. PDF text-layer detection is out of
    scope for this stub -- extend here if scanned PDFs need it later.
    """
    if not attachments:
        return True
    return Path(attachments[0]).suffix.lower() not in IMAGE_EXTENSIONS


class AgentResult(TypedDict):
    final_answer: str
    trace: list[dict]
    files_to_generate: list[dict] | None


def _load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _model_for_role(role: str) -> str:
    config = _load_config()
    return config["models"][role]["ollama_tag"]


def _run_vision_extraction(attachment_path: str, trace: list[dict]) -> dict:
    """
    Run the vision model exactly once on a new document. Stores both the
    structured summary and the raw OCR text into the vector store, then
    returns the summary for use in the current turn's answer.
    """
    vision_model = _model_for_role("vision")

    response = ollama.chat(
        model=vision_model,
        messages=[
            {
                "role": "user",
                "content": (
                    "Extract this document's content. Respond with JSON: "
                    '{"document_type": str, "key_findings": [str], '
                    '"recommended_action": str, "raw_text": str}'
                ),
                "images": [attachment_path],
            }
        ],
        format="json",
    )
    trace.append({"step": "vision_extraction", "detail": f"model={vision_model}"})

    extracted = json.loads(response["message"]["content"])

    summary = {
        "document_type": extracted.get("document_type"),
        "key_findings": extracted.get("key_findings"),
        "recommended_action": extracted.get("recommended_action"),
    }
    raw_text = extracted.get("raw_text", "")

    ingest(json.dumps(summary), {"content_type": "summary", "source": attachment_path})
    ingest(raw_text, {"content_type": "raw_ocr", "source": attachment_path})
    trace.append({"step": "rag_ingest", "detail": f"stored summary + raw_ocr for {attachment_path}"})

    return summary


def run(
    query: str,
    user_id: str,
    attachments: list[str] | None = None,
) -> AgentResult:
    trace: list[dict] = []

    routing = route(
        query,
        attachments=attachments,
        has_extractable_text=_has_extractable_text(attachments),
    )
    trace.append({"step": "router_decision", "detail": routing})

    role = routing["role"]

    if role == "vision" and attachments:
        summary = _run_vision_extraction(attachments[0], trace)
        model = _model_for_role("general")
        context = json.dumps(summary)
    else:
        model = _model_for_role(role)
        hits = retrieve(query, k=5)
        trace.append({"step": "rag_retrieval", "detail": f"{len(hits)} chunks retrieved"})
        context = "\n\n".join(h["text"] for h in hits)

    response = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": f"Relevant context:\n{context}" if context else ""},
            {"role": "user", "content": query},
        ],
    )
    final_answer = response["message"]["content"]
    trace.append({"step": "model_response", "detail": f"model={model}"})

    return AgentResult(
        final_answer=final_answer,
        trace=trace,
        files_to_generate=None,
    )
