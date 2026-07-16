import type { Severity } from './findings'

/**
 * A single rule within a policy that remaps severity for a specific check.
 */
export interface PolicyRule {
  id: string
  checkName: string           // The check_name to target (e.g., "integer-overflow")
  targetSeverity: Severity    // The remapped severity
  reason?: string             // Optional justification for the remap
  createdAt: number           // Unix timestamp
  createdBy?: string          // wallet address of creator
}

/**
 * A policy containing rules for remapping finding severities.
 * Policies are stored server-side and can be shared across an organization.
 */
export interface Policy {
  id: string
  name: string
  description?: string
  rules: PolicyRule[]
  createdAt: number           // Unix timestamp
  updatedAt: number           // Unix timestamp
  owner?: string              // wallet address for ownership
}

/**
 * Input for creating a new policy.
 */
export interface CreatePolicyInput {
  name: string
  description?: string
  owner?: string
}

/**
 * Input for updating an existing policy.
 */
export interface UpdatePolicyInput {
  name?: string
  description?: string
}

/**
 * Input for creating a new rule within a policy.
 */
export interface CreateRuleInput {
  checkName: string
  targetSeverity: Severity
  reason?: string
  createdBy?: string
}
