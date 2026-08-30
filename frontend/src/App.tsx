import { useState } from "react"
import { ConversationView } from "./components/ConversationView"
import { EmptyStateHero } from "./components/EmptyStateHero"
import { Sidebar } from "./components/Sidebar"
import { TopBar } from "./components/TopBar"
import { useAgentChat } from "./hooks/useAgentChat"

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  )
  const { sessions, activeSession, activeSessionId, pending, newTask, selectSession, submit, documents } =
    useAgentChat()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian text-bone">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewTask={newTask}
        documents={documents}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={activeSession?.title ?? "New task"} />
        {activeSession ? (
          <ConversationView messages={activeSession.messages} onSubmit={submit} pending={pending} />
        ) : (
          <EmptyStateHero onSubmit={submit} />
        )}
      </div>
    </div>
  )
}

export default App
