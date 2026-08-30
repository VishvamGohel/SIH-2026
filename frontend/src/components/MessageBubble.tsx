import { DocumentIcon } from "./icons"
import { TraceView } from "./TraceView"
import type { ChatMessage } from "../types/chat"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75ch] ${isUser ? "" : "w-full"}`}>
        {message.attachmentNames && message.attachmentNames.length > 0 && (
          <div className={`mb-1.5 flex flex-wrap gap-1.5 ${isUser ? "justify-end" : ""}`}>
            {message.attachmentNames.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-ember px-2 py-1 text-xs text-ash"
              >
                <DocumentIcon className="h-3 w-3" />
                {name}
              </span>
            ))}
          </div>
        )}
        <div
          className={
            isUser
              ? "rounded-2xl rounded-tr-sm bg-ember px-4 py-2.5 text-[15px] text-obsidian"
              : "rounded-2xl rounded-tl-sm bg-slate-ember px-4 py-2.5 text-[15px] text-bone"
          }
        >
          {message.pending ? (
            <span className="inline-flex items-center gap-1 text-ash">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash" />
            </span>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
        </div>
        {!isUser && message.trace && <TraceView trace={message.trace} />}
      </div>
    </div>
  )
}
