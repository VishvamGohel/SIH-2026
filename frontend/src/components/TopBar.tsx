import { SovereigntyChip } from "./SovereigntyChip"

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
      <span className="truncate text-sm text-ash">{title}</span>
      <SovereigntyChip />
    </header>
  )
}
