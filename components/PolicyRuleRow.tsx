'use client'

import type { PolicyRule } from '@/types/policy'
import type { Severity } from '@/types/findings'

const severityColors: Record<Severity, string> = {
  Critical: 'text-rose-400',
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-sky-400',
  Info: 'text-slate-400',
}

interface Props {
  rule: PolicyRule
  onRemove: () => void
  disabled?: boolean
}

export default function PolicyRuleRow({ rule, onRemove, disabled }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#2a2d3a] bg-[#0e1117] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="truncate text-sm font-medium text-slate-200">{rule.checkName}</code>
          <svg className="h-4 w-4 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className={`text-sm font-semibold ${severityColors[rule.targetSeverity]}`}>
            {rule.targetSeverity}
          </span>
        </div>
        {rule.reason && (
          <p className="mt-0.5 truncate text-xs text-slate-500" title={rule.reason}>
            {rule.reason}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="flex-shrink-0 rounded p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        title="Remove rule"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
