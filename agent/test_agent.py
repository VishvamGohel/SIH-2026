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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
