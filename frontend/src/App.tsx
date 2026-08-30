import { useState } from "react"
import { runAgent } from "./api"
import type { AgentResult } from "./types/agent"

// Placeholder scaffold -- real UI pending design.md.
// Confirms the toolchain (Tailwind, mock API, types) works end-to-end.
function App() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<AgentResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRun() {
    setLoading(true)
    try {
      const res = await runAgent({ query, user_id: "dev" })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Frontend scaffold ready</h1>
      <p className="text-neutral-400 text-sm">Waiting on design.md for the real UI.</p>
      <div className="flex gap-2 w-full max-w-md">
        <input
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: summarize this document"
        />
        <button
          className="rounded bg-neutral-100 text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={handleRun}
          disabled={loading || !query}
        >
          {loading ? "Running..." : "Run"}
        </button>
      </div>
      {result && (
        <pre className="text-xs bg-neutral-900 border border-neutral-800 rounded p-4 max-w-lg overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default App
