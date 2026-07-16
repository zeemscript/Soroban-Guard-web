'use client'

import { useState, useRef, useEffect } from 'react'
import { usePolicyContext } from '@/lib/PolicyContext'

interface Props {
  onManagePolicies: () => void
}

export default function PolicySelector({ onManagePolicies }: Props) {
  const { policies, activePolicy, selectPolicy, loading } = usePolicyContext()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="max-w-[120px] truncate">
          {loading ? 'Loading...' : activePolicy ? activePolicy.name : 'No policy'}
        </span>
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-[#2a2d3a] bg-[#0e1117] shadow-xl"
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                selectPolicy(null)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[#1a1d27] ${
                !activePolicy ? 'text-indigo-400' : 'text-slate-300'
              }`}
              role="option"
              aria-selected={!activePolicy}
            >
              {!activePolicy && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className={!activePolicy ? '' : 'ml-6'}>No policy (use scanner defaults)</span>
            </button>

            {policies.length > 0 && (
              <div className="my-1 border-t border-[#2a2d3a]" />
            )}

            {policies.map(policy => (
              <button
                key={policy.id}
                type="button"
                onClick={() => {
                  selectPolicy(policy.id)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[#1a1d27] ${
                  activePolicy?.id === policy.id ? 'text-indigo-400' : 'text-slate-300'
                }`}
                role="option"
                aria-selected={activePolicy?.id === policy.id}
              >
                {activePolicy?.id === policy.id && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <div className={activePolicy?.id === policy.id ? '' : 'ml-6'}>
                  <div className="font-medium">{policy.name}</div>
                  {policy.description && (
                    <div className="text-xs text-slate-500 truncate">{policy.description}</div>
                  )}
                  <div className="text-xs text-slate-600">
                    {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-[#2a2d3a] p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onManagePolicies()
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600/10 px-3 py-1.5 text-sm font-medium text-indigo-400 transition hover:bg-indigo-600/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Policies
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
