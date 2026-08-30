// Small inline icon set -- kept as plain SVGs rather than an icon
// library dependency, sized/stroked to match this design system.
type IconProps = { className?: string }

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 10h11m0 0-4.5-4.5M15 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SidebarToggleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 3.5v13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3.5h6l3 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 3.5V7h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7.5" cy="8" r="1.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 14 3.8-3.8a1.5 1.5 0 0 1 2.1 0L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="m7 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
