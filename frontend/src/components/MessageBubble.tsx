import { AlertIcon, DocumentIcon, ScanIcon } from "./icons"
import { TraceView } from "./TraceView"
import type { ChatMessage } from "../types/chat"

interface MessageBubbleProps {
  message: ChatMessage
}

function PendingContent({ expectingVision }: { expectingVision?: boolean }) {
  if (expectingVision) {
    return (
      <span className="inline-flex items-center gap-2 text-ash">
        <ScanIcon className="status-dot h-4 w-4 text-ember" />
        <span>Reading document…</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-ash">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash" />
    </span>
  )
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
              : message.isError
                ? "flex items-start gap-2 rounded-2xl rounded-tl-sm border border-ember-dim/40 bg-slate-ember px-4 py-2.5 text-[15px] text-bone"
                : "rounded-2xl rounded-tl-sm bg-slate-ember px-4 py-2.5 text-[15px] text-bone"
          }
        >
          {message.pending ? (
            <PendingContent expectingVision={message.expectingVision} />
          ) : message.isError ? (
            <>
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <p className="whitespace-pre-wrap leading-relaxed text-ash">
                Couldn't complete this request. {message.content}
              </p>
            </>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
        </div>
        {!isUser && message.trace && <TraceView trace={message.trace} />}
      </div>
    </div>
  )
}
