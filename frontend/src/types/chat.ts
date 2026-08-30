import type { TraceEntry } from "./agent"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  attachmentNames?: string[]
  trace?: TraceEntry[]
  pending?: boolean
}

export interface Session {
  id: string
  title: string
  messages: ChatMessage[]
}
