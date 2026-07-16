import type { Severity } from '@/types/findings'

interface Props {
  severity: Severity
  originalSeverity?: Severity  // Set when policy remapped severity
  policyName?: string          // Name of the policy that applied the remap
  size?: 'sm' | 'md'
  includeIcon?: boolean
}

// Badge style definitions for each severity level (supporting Critical above High)
const styles: Record<Severity, string> = {
  Critical: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  High: 'bg-red-500/15 text-red-400 border border-red-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Low: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  Info: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
}

const dots: Record<Severity, string> = {
  Critical: 'bg-rose-400',
  High: 'bg-red-400',
  Medium: 'bg-amber-400',
  Low: 'bg-sky-400',
  Info: 'bg-slate-300',
}

const icons: Record<Severity, string> = {
  Critical: '!!!',
  High: '!!',
  Medium: '!',
  Low: 'ⓘ',
  Info: 'ℹ',
}

export default function SeverityBadge({ severity, originalSeverity, policyName, size = 'md', includeIcon = true }: Props) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  const isPolicyModified = originalSeverity !== undefined && originalSeverity !== severity

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${padding} ${styles[severity]}`}
        role="status"
        aria-label={`${severity} severity${isPolicyModified ? ` (was ${originalSeverity})` : ''}`}
        title={isPolicyModified ? `Remapped by policy: ${policyName || 'Unknown'}` : undefined}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dots[severity]}`} aria-hidden="true" />
        {includeIcon && <span className="font-mono text-[0.7em] font-bold" aria-hidden="true">{icons[severity]}</span>}
        <span>{severity}</span>
      </span>
      {isPolicyModified && (
        <span
          className="inline-flex items-center gap-1 text-xs text-slate-500"
          title={`Original severity: ${originalSeverity}. Remapped by policy: ${policyName || 'Unknown'}`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="line-through">{originalSeverity}</span>
        </span>
      )}
    </span>
  )
}
