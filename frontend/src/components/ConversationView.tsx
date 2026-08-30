import { useEffect, useRef } from "react"
import { ChatInput } from "./ChatInput"
import { MessageBubble } from "./MessageBubble"
import type { ChatMessage } from "../types/chat"

interface ConversationViewProps {
  messages: ChatMessage[]
  onSubmit: (query: string, attachments: File[]) => void
  pending: boolean
}

export function ConversationView({ messages, onSubmit, pending }: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length])

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-obsidian">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="border-t border-white/10 bg-obsidian px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSubmit={onSubmit} disabled={pending} />
        </div>
      </div>
    </div>
  )
}
