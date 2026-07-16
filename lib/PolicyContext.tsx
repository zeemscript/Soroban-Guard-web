'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Policy, CreatePolicyInput, CreateRuleInput } from '@/types/policy'

const ACTIVE_POLICY_KEY = 'sg_active_policy_id'

interface PolicyContextValue {
  policies: Policy[]
  activePolicy: Policy | null
  loading: boolean
  error: string | null
  refreshPolicies: () => Promise<void>
  selectPolicy: (id: string | null) => void
  createPolicy: (input: CreatePolicyInput) => Promise<Policy | null>
  updatePolicy: (id: string, input: { name?: string; description?: string }) => Promise<Policy | null>
  deletePolicy: (id: string) => Promise<boolean>
  addRule: (policyId: string, rule: CreateRuleInput) => Promise<Policy | null>
  removeRule: (policyId: string, ruleId: string) => Promise<Policy | null>
}

const PolicyContext = createContext<PolicyContextValue | null>(null)

function getStoredActivePolicyId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_POLICY_KEY)
  } catch {
    return null
  }
}

function setStoredActivePolicyId(id: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (id) {
      localStorage.setItem(ACTIVE_POLICY_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_POLICY_KEY)
    }
  } catch {
    // Silently fail
  }
}

export function PolicyProvider({ children }: { children: ReactNode }) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshPolicies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/policies')
      if (!res.ok) {
        throw new Error('Failed to fetch policies')
      }
      const data = await res.json()
      const fetchedPolicies = data.policies as Policy[]
      setPolicies(fetchedPolicies)

      // Restore active policy from localStorage
      const storedId = getStoredActivePolicyId()
      if (storedId) {
        const policy = fetchedPolicies.find(p => p.id === storedId)
        setActivePolicy(policy ?? null)
        if (!policy) {
          // Stored policy no longer exists, clear it
          setStoredActivePolicyId(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshPolicies()
  }, [refreshPolicies])

  const selectPolicy = useCallback((id: string | null) => {
    if (id === null) {
      setActivePolicy(null)
      setStoredActivePolicyId(null)
      return
    }
    const policy = policies.find(p => p.id === id)
    if (policy) {
      setActivePolicy(policy)
      setStoredActivePolicyId(id)
    }
  }, [policies])

  const createPolicyFn = useCallback(async (input: CreatePolicyInput): Promise<Policy | null> => {
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create policy')
      }
      const data = await res.json()
      const newPolicy = data.policy as Policy
      setPolicies(prev => [newPolicy, ...prev])
      return newPolicy
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [])

  const updatePolicyFn = useCallback(async (
    id: string,
    input: { name?: string; description?: string }
  ): Promise<Policy | null> => {
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update policy')
      }
      const data = await res.json()
      const updatedPolicy = data.policy as Policy
      setPolicies(prev => prev.map(p => p.id === id ? updatedPolicy : p))
      if (activePolicy?.id === id) {
        setActivePolicy(updatedPolicy)
      }
      return updatedPolicy
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [activePolicy])

  const deletePolicyFn = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/policies/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete policy')
      }
      setPolicies(prev => prev.filter(p => p.id !== id))
      if (activePolicy?.id === id) {
        setActivePolicy(null)
        setStoredActivePolicyId(null)
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }, [activePolicy])

  const addRuleFn = useCallback(async (policyId: string, rule: CreateRuleInput): Promise<Policy | null> => {
    try {
      const res = await fetch(`/api/policies/${policyId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add rule')
      }
      const data = await res.json()
      const updatedPolicy = data.policy as Policy
      setPolicies(prev => prev.map(p => p.id === policyId ? updatedPolicy : p))
      if (activePolicy?.id === policyId) {
        setActivePolicy(updatedPolicy)
      }
      return updatedPolicy
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [activePolicy])

  const removeRuleFn = useCallback(async (policyId: string, ruleId: string): Promise<Policy | null> => {
    try {
      const res = await fetch(`/api/policies/${policyId}/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove rule')
      }
      const data = await res.json()
      const updatedPolicy = data.policy as Policy
      setPolicies(prev => prev.map(p => p.id === policyId ? updatedPolicy : p))
      if (activePolicy?.id === policyId) {
        setActivePolicy(updatedPolicy)
      }
      return updatedPolicy
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [activePolicy])

  return (
    <PolicyContext.Provider
      value={{
        policies,
        activePolicy,
        loading,
        error,
        refreshPolicies,
        selectPolicy,
        createPolicy: createPolicyFn,
        updatePolicy: updatePolicyFn,
        deletePolicy: deletePolicyFn,
        addRule: addRuleFn,
        removeRule: removeRuleFn,
      }}
    >
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicyContext(): PolicyContextValue {
  const ctx = useContext(PolicyContext)
  if (!ctx) throw new Error('usePolicyContext must be used inside PolicyProvider')
  return ctx
}
