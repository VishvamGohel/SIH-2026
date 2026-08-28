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
import os
import tempfile
from pathlib import Path
from typing import TypedDict

import ollama
from PIL import Image

import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "router"))
from router import route  # noqa: E402
from rag import ingest, retrieve  # noqa: E402

CONFIG_PATH = Path(__file__).parent.parent / "router" / "model_config.json"
RECURSION_LIMIT = 15

# Ollama defaults to a 4096-token runtime context regardless of what a
# model architecturally supports -- an image alone can exceed that, so
# every chat call must request a larger window explicitly. Kept modest
# (not the model's full context_window from model_config.json) to stay
# within Machine A's 4GB VRAM budget -- KV cache scales with this.
RUNTIME_CONTEXT = 8192

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}

# Vision token cost scales with image resolution -- an uncapped phone
# photo can blow past RUNTIME_CONTEXT on its own and take minutes on
# CPU. Downscale before sending; this is plenty for OCR-quality text.
MAX_IMAGE_DIMENSION = 1280


def _downscale_for_vision(image_path: str) -> str:
    """
    Resize an image so its longest side is at most MAX_IMAGE_DIMENSION,
    preserving aspect ratio. Returns a path to the (possibly new,
    temp-file) resized image; returns the original path unchanged if
    it's already small enough.
    """
    with Image.open(image_path) as img:
        width, height = img.size
        if max(width, height) <= MAX_IMAGE_DIMENSION:
            return image_path

        scale = MAX_IMAGE_DIMENSION / max(width, height)
        new_size = (int(width * scale), int(height * scale))
        resized = img.convert("RGB").resize(new_size, Image.LANCZOS)

        fd, temp_path = tempfile.mkstemp(suffix=".jpg")
        os.close(fd)
        resized.save(temp_path, "JPEG", quality=90)
        return temp_path


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
    resized_path = _downscale_for_vision(attachment_path)
    if resized_path != attachment_path:
        trace.append({"step": "image_downscaled", "detail": f"resized to max {MAX_IMAGE_DIMENSION}px"})

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
                "images": [resized_path],
            }
        ],
        format="json",
        options={"num_ctx": RUNTIME_CONTEXT},
    )
    trace.append({"step": "vision_extraction", "detail": f"model={vision_model}"})

    if resized_path != attachment_path:
        os.remove(resized_path)

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
        options={"num_ctx": RUNTIME_CONTEXT},
    )
    final_answer = response["message"]["content"]
    trace.append({"step": "model_response", "detail": f"model={model}"})

    return AgentResult(
        final_answer=final_answer,
        trace=trace,
        files_to_generate=None,
    )
