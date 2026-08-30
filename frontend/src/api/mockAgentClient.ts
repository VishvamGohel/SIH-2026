// Stands in for Dharm's not-yet-built FastAPI backend. Mirrors the
// exact shape and step sequence agent/agent.py's run() actually
// produces (verified against real runs during backend development),
// so swapping this for a real HTTP call later requires no UI changes
// -- only api/index.ts's export needs to change.

import type { AgentRequest, AgentResult, TraceEntry } from "../types/agent"

const CODE_KEYWORDS = ["function", "code", "script", "python", "write a", "bug", "refactor"]
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function classify(query: string, hasImage: boolean): "general" | "code" | "vision" {
  if (hasImage) return "vision"
  const lower = query.toLowerCase()
  if (CODE_KEYWORDS.some((kw) => lower.includes(kw))) return "code"
  return "general"
}

export async function mockRun({ query, attachments }: AgentRequest): Promise<AgentResult> {
  const hasImage = !!attachments?.some((f) =>
    IMAGE_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)),
  )
  const role = classify(query, hasImage)
  const trace: TraceEntry[] = []

  trace.push({
    step: "router_decision",
    detail: { role, confidence: 0.55 + Math.random() * 0.3, override: hasImage },
  })
  await delay(300)

  let finalAnswer: string

  if (role === "vision") {
    trace.push({ step: "image_downscaled", detail: "resized to max 1280px" })
    await delay(600)
    trace.push({ step: "vision_extraction", detail: "model=qwen3.5:2b" })
    await delay(900)
    trace.push({ step: "rag_ingest", detail: `stored summary + raw_ocr for ${attachments?.[0]?.name}` })
    finalAnswer =
      "Based on the attached document: the inspection notes minor corrosion on the primary valve and recommends seal replacement within 30 days. (mock response -- real backend not yet connected)"
  } else if (role === "code") {
    await delay(700)
    finalAnswer =
      "```python\ndef reverse_string(s: str) -> str:\n    return s[::-1]\n```\n(mock response -- real backend not yet connected)"
  } else {
    trace.push({ step: "rag_retrieval", detail: "3 chunks retrieved" })
    await delay(700)
    finalAnswer =
      "According to the retrieved documents, the recommended action should be completed within the stated timeframe. (mock response -- real backend not yet connected)"
  }

  trace.push({ step: "model_response", detail: `model=${role === "code" ? "qwen2.5-coder:3b" : "qwen3:1.7b"}` })

  return {
    final_answer: finalAnswer,
    trace,
    files_to_generate: null,
  }
}
