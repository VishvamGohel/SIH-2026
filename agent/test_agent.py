"""
Tests for agent.py. Integration tests against real Ollama models --
requires all 4 pulled models available locally.
"""

import pytest

from agent import run


def test_run_returns_agent_result_shape():
    result = run("What is 2+2?", user_id="test-user")
    assert "final_answer" in result
    assert "trace" in result
    assert "files_to_generate" in result
    assert isinstance(result["final_answer"], str)
    assert isinstance(result["trace"], list)


def test_run_trace_includes_router_decision():
    result = run("Summarize this SOP.", user_id="test-user")
    steps = [entry["step"] for entry in result["trace"]]
    assert "router_decision" in steps


def test_run_code_query_routes_to_code_model():
    result = run("Write a function that reverses a string.", user_id="test-user")
    router_entry = next(e for e in result["trace"] if e["step"] == "router_decision")
    assert router_entry["detail"]["role"] == "code"


def test_run_general_query_produces_nonempty_answer():
    result = run("Explain what a checksum is.", user_id="test-user")
    assert len(result["final_answer"]) > 0


def test_run_with_image_attachment_triggers_vision_override():
    """
    Regression test: agent.run() must actually detect image attachments
    and route to vision, not silently fall through to the general/RAG
    path and ignore the attached image.
    """
    import os

    scratch_dir = os.environ.get("TEMP", ".")
    image_path = os.path.join(scratch_dir, "regression_test_image.png")
    from PIL import Image

    Image.new("RGB", (100, 100), color="white").save(image_path)

    result = run("What does this say?", user_id="test-user", attachments=[image_path])
    router_entry = next(e for e in result["trace"] if e["step"] == "router_decision")
    assert router_entry["detail"]["role"] == "vision"
    assert router_entry["detail"]["override"] is True
    steps = [e["step"] for e in result["trace"]]
    assert "vision_extraction" in steps


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
