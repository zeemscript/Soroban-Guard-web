'use client'

import { useState } from 'react'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { usePolicyContext } from '@/lib/PolicyContext'
import PolicyRuleRow from './PolicyRuleRow'
import type { Policy } from '@/types/policy'
import type { Severity } from '@/types/findings'

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

interface Props {
  onClose: () => void
  editPolicy?: Policy | null
}

export default function PolicyModal({ onClose, editPolicy }: Props) {
  const {
    policies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    addRule,
    removeRule,
    selectPolicy,
  } = usePolicyContext()

  const [view, setView] = useState<'list' | 'create' | 'edit'>(editPolicy ? 'edit' : 'list')
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(editPolicy ?? null)

  // Form state for create/edit
  const [name, setName] = useState(editPolicy?.name ?? '')
  const [description, setDescription] = useState(editPolicy?.description ?? '')

  // Rule form state
  const [checkName, setCheckName] = useState('')
  const [targetSeverity, setTargetSeverity] = useState<Severity>('Low')
  const [reason, setReason] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dialogRef = useFocusTrap<HTMLDivElement>(onClose)

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setBusy(true)
    setError(null)

    const policy = await createPolicy({ name: name.trim(), description: description.trim() || undefined })
    setBusy(false)

    if (policy) {
      setSelectedPolicy(policy)
      setView('edit')
      setName('')
      setDescription('')
    } else {
      setError('Failed to create policy')
    }
  }

  async function handleUpdatePolicy(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPolicy || !name.trim()) return

    setBusy(true)
    setError(null)

    const updated = await updatePolicy(selectedPolicy.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    })
    setBusy(false)

    if (updated) {
      setSelectedPolicy(updated)
    } else {
      setError('Failed to update policy')
    }
  }

  async function handleDeletePolicy() {
    if (!selectedPolicy) return
    if (!confirm(`Delete policy "${selectedPolicy.name}"? This cannot be undone.`)) return

    setBusy(true)
    setError(null)

    const success = await deletePolicy(selectedPolicy.id)
    setBusy(false)

    if (success) {
      setSelectedPolicy(null)
      setView('list')
    } else {
      setError('Failed to delete policy')
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPolicy || !checkName.trim()) return

    setBusy(true)
    setError(null)

    const updated = await addRule(selectedPolicy.id, {
      checkName: checkName.trim(),
      targetSeverity,
      reason: reason.trim() || undefined,
    })
    setBusy(false)

    if (updated) {
      setSelectedPolicy(updated)
      setCheckName('')
      setReason('')
    } else {
      setError('Failed to add rule')
    }
  }

  async function handleRemoveRule(ruleId: string) {
    if (!selectedPolicy) return

    setBusy(true)
    setError(null)

    const updated = await removeRule(selectedPolicy.id, ruleId)
    setBusy(false)

    if (updated) {
      setSelectedPolicy(updated)
    } else {
      setError('Failed to remove rule')
    }
  }

  function openEditPolicy(policy: Policy) {
    setSelectedPolicy(policy)
    setName(policy.name)
    setDescription(policy.description ?? '')
    setView('edit')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl border border-[#2a2d3a] bg-[#0e1117] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2d3a] px-6 py-4">
          <h2 id="policy-modal-title" className="text-lg font-semibold text-white">
            {view === 'list' && 'Manage Policies'}
            {view === 'create' && 'Create Policy'}
            {view === 'edit' && 'Edit Policy'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* List View */}
          {view === 'list' && (
            <div className="space-y-3">
              {policies.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No policies yet. Create one to customize finding severities.
                </p>
              ) : (
                policies.map(policy => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between rounded-lg border border-[#2a2d3a] bg-[#12151f] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200">{policy.name}</div>
                      {policy.description && (
                        <p className="text-xs text-slate-500 truncate">{policy.description}</p>
                      )}
                      <p className="text-xs text-slate-600">
                        {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          selectPolicy(policy.id)
                          onClose()
                        }}
                        className="rounded px-2 py-1 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditPolicy(policy)}
                        className="rounded p-1 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                        title="Edit policy"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => {
                  setName('')
                  setDescription('')
                  setView('create')
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#2a2d3a] bg-[#12151f] px-4 py-3 text-sm text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create New Policy
              </button>
            </div>
          )}

          {/* Create View */}
          {view === 'create' && (
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label htmlFor="policy-name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Policy Name
                </label>
                <input
                  id="policy-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Production Rules"
                  disabled={busy}
                  className="w-full rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="policy-desc" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Description (optional)
                </label>
                <input
                  id="policy-desc"
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., Severity adjustments for production contracts"
                  disabled={busy}
                  className="w-full rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-[#2a2d3a] py-2 text-sm font-medium text-slate-300 transition hover:bg-[#1a1d27] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !name.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          )}

          {/* Edit View */}
          {view === 'edit' && selectedPolicy && (
            <div className="space-y-6">
              {/* Policy details form */}
              <form onSubmit={handleUpdatePolicy} className="space-y-4">
                <div>
                  <label htmlFor="edit-policy-name" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Policy Name
                  </label>
                  <input
                    id="edit-policy-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-policy-desc" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <input
                    id="edit-policy-desc"
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy || !name.trim()}
                  className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </form>

              {/* Rules section */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-200">Severity Remap Rules</h3>

                {selectedPolicy.rules.length === 0 ? (
                  <p className="text-sm text-slate-500 mb-4">
                    No rules yet. Add rules to remap check severities.
                  </p>
                ) : (
                  <div className="mb-4 space-y-2">
                    {selectedPolicy.rules.map(rule => (
                      <PolicyRuleRow
                        key={rule.id}
                        rule={rule}
                        onRemove={() => handleRemoveRule(rule.id)}
                        disabled={busy}
                      />
                    ))}
                  </div>
                )}

                {/* Add rule form */}
                <form onSubmit={handleAddRule} className="rounded-lg border border-[#2a2d3a] bg-[#12151f] p-4">
                  <p className="mb-3 text-xs font-medium text-slate-400">Add Rule</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="check-name" className="mb-1 block text-xs text-slate-500">
                        Check Name
                      </label>
                      <input
                        id="check-name"
                        type="text"
                        value={checkName}
                        onChange={e => setCheckName(e.target.value)}
                        placeholder="e.g., integer-overflow"
                        disabled={busy}
                        className="w-full rounded-lg border border-[#2a2d3a] bg-[#0e1117] px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 disabled:opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="target-severity" className="mb-1 block text-xs text-slate-500">
                        Target Severity
                      </label>
                      <select
                        id="target-severity"
                        value={targetSeverity}
                        onChange={e => setTargetSeverity(e.target.value as Severity)}
                        disabled={busy}
                        className="w-full rounded-lg border border-[#2a2d3a] bg-[#0e1117] px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-indigo-500/60 disabled:opacity-50"
                      >
                        {SEVERITIES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="rule-reason" className="mb-1 block text-xs text-slate-500">
                      Reason (optional)
                    </label>
                    <input
                      id="rule-reason"
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="e.g., Not applicable for our use case"
                      disabled={busy}
                      className="w-full rounded-lg border border-[#2a2d3a] bg-[#0e1117] px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !checkName.trim()}
                    className="mt-3 w-full rounded-lg bg-indigo-600/20 py-1.5 text-sm font-medium text-indigo-400 transition hover:bg-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add Rule
                  </button>
                </form>
              </div>

              {/* Footer actions */}
              <div className="flex gap-3 border-t border-[#2a2d3a] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicy(null)
                    setView('list')
                  }}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-[#2a2d3a] py-2 text-sm font-medium text-slate-300 transition hover:bg-[#1a1d27] disabled:opacity-50"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handleDeletePolicy}
                  disabled={busy}
                  className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
