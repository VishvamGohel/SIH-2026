[README (1).md](https://github.com/user-attachments/files/32201713/README.1.md)
# Sovereign AI Workbench — PS 26117

A self-hosted, offline AI assistant for organisations that can't use cloud AI tools because their data can't leave the building — refineries, PSUs, defence-linked manufacturing, government offices. Built for **Smart India Hackathon 2026, Problem Statement 26117**.

No cloud APIs. No external network calls, ever. Everything — the AI models, the document search, the code execution — runs on your own machine.

---

## What it actually does

- **Reads and answers from your own documents** (SOPs, manuals, scanned reports) instead of guessing
- **Understands images and scanned documents** — P&IDs, engineering drawings, photographs — through a local vision model
- **Writes and runs code safely**, inside a sandboxed, network-disabled environment
- **Automatically picks the right AI model for the job** — a routing layer sends coding questions to a coding model, document questions to a reasoning model, and images to a vision model, without you choosing manually

## How it fits together

```
  You  ->  Web App  ->  Router  ->  the right specialist model
                                     (general reasoning / code / vision)
                                          |
                                          v
                              Your own documents (searched locally)
                                          |
                                          v
                              Answer, code, or a generated file
```

Every step is logged, and nothing above ever makes an outbound network call — that's the whole point.

---

## Project layout

| Folder | What's in it |
|---|---|
| `/backend` | The real, running system — FastAPI server, the router, and three specialist agents (reasoning, code, vision). **Start here if you want to run the actual product.** |
| `/frontend` | The web app you interact with. Can run entirely on its own with fake data, or connect to `/backend` for the real thing. |
| `/router`, `/agent` | Earlier, standalone prototypes of the routing and agent logic, built before `/backend` existed. Kept for reference — not part of the running system anymore. |
| `CLAUDE.md` | Project context and architecture notes, written for AI coding assistants working on this repo — also a decent read for a human wanting the full technical picture. |

Both `/backend` and `/frontend` have their own, more detailed README — this file is the map; those are the deep dive.

---

## Getting started

### 1. Install Ollama and pull the base models

[Ollama](https://ollama.com) runs the AI models locally. Once installed:

```bash
ollama pull qwen3:1.7b
ollama pull qwen2.5-coder:3b
ollama pull qwen3.5:2b
ollama pull nomic-embed-text
```

### 2. Build the custom models

The backend calls the models by custom names with tuned settings (response limits, system prompts) rather than the raw base models — these are defined in `backend/MODELFILES/`:

```bash
cd backend/MODELFILES
ollama create eng-instructions -f Modelfile.instruction_follower
ollama create eng-coder -f Modelfile.coder
ollama create eng-vision -f Modelfile.vision_thinking
ollama create eng-embeddings -f Modelfile.embeddings
```

### 3. Run the backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```

Check it's alive: open `http://localhost:8000/health` — you should see a healthy status. `/health/deep` also checks Ollama is actually reachable.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. **By default it runs against fake sample data**, so you can see and click through the whole app without the backend or Ollama running at all.

To connect it to the real backend, create `frontend/.env.local`:
```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000
```

---

## Running the tests

```bash
cd backend
pytest tests/ -v
```

These are fully mocked — no live Ollama connection needed, so they run fast and check the actual logic (routing decisions, vision handling, document processing).

---

## Current status

**Working end to end:** the router, all three specialist models, document search, image/scanned-document understanding, sandboxed code execution, and a real frontend wired to the real backend — not just a mockup.

**Known rough edges:** a handful of smaller issues are tracked directly in `backend/README.md` and `frontend/README.md` (things like occasional inconsistent routing on ambiguous queries, and a couple of edge cases in how the vision model's output gets parsed). Nothing there blocks the core system from working — worth a skim before you build on top of a specific piece.

---

## Team

| Role | Owns |
|---|---|
| AI / Agent Lead | Router, agent logic, model setup |
| Backend | API service, sandbox, document generation, auth |
| Frontend | The web app |
| Documentation | Keeping this accurate, PS requirement tracking |
| Presentation | Slide deck, demo narrative |
| Security & Testing | Sovereignty proof, sandbox isolation, RBAC testing |

---

## Tech stack

Python, FastAPI, LangGraph, Docker · React, TypeScript, Vite, Tailwind · ChromaDB · Ollama · Qwen open-weight model family (Apache 2.0)
