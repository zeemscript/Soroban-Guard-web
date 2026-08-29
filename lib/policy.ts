import type { Policy, PolicyRule, CreatePolicyInput, UpdatePolicyInput, CreateRuleInput } from '@/types/policy'

const INDEX_KEY = 'policies:index'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// In-memory fallback (used when KV_REST_API_URL is not configured)
const memStore = new Map<string, Policy>()
let memIndex: string[] = []

async function kvGet<T>(key: string): Promise<T | null> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    return kv.get<T>(key)
  }
  if (key === INDEX_KEY) return memIndex as T
  return (memStore.get(key) as T) ?? null
}

async function kvSet<T>(key: string, value: T): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, value)
  } else {
    if (key === INDEX_KEY) {
      memIndex = value as string[]
    } else {
      memStore.set(key, value as Policy)
    }
  }
}

async function kvDel(key: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.del(key)
  } else {
    memStore.delete(key)
  }
}

function policyKey(id: string): string {
  return `policy:${id}`
}

/**
 * Fetch a single policy by ID.
 */
export async function getPolicy(id: string): Promise<Policy | null> {
  return kvGet<Policy>(policyKey(id))
}

/**
 * List all policies.
 */
export async function listPolicies(): Promise<Policy[]> {
  const index = await kvGet<string[]>(INDEX_KEY)
  if (!index || index.length === 0) return []

  const policies: Policy[] = []
  for (const id of index) {
    const policy = await kvGet<Policy>(policyKey(id))
    if (policy) policies.push(policy)
  }
  return policies.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Create a new policy.
 */
export async function createPolicy(input: CreatePolicyInput): Promise<Policy> {
  const now = Date.now()
  const policy: Policy = {
    id: generateId(),
    name: input.name,
    description: input.description,
    rules: [],
    createdAt: now,
    updatedAt: now,
    owner: input.owner,
  }

  await kvSet(policyKey(policy.id), policy)

  const index = (await kvGet<string[]>(INDEX_KEY)) ?? []
  index.push(policy.id)
  await kvSet(INDEX_KEY, index)

  return policy
}

/**
 * Update an existing policy.
 */
export async function updatePolicy(id: string, input: UpdatePolicyInput): Promise<Policy | null> {
  const policy = await getPolicy(id)
  if (!policy) return null

  const updated: Policy = {
    ...policy,
    name: input.name ?? policy.name,
    description: input.description !== undefined ? input.description : policy.description,
    updatedAt: Date.now(),
  }

  await kvSet(policyKey(id), updated)
  return updated
}

/**
 * Delete a policy.
 */
export async function deletePolicy(id: string): Promise<boolean> {
  const policy = await getPolicy(id)
  if (!policy) return false

  await kvDel(policyKey(id))

  const index = (await kvGet<string[]>(INDEX_KEY)) ?? []
  const newIndex = index.filter(i => i !== id)
  await kvSet(INDEX_KEY, newIndex)

  return true
}

/**
 * Add a rule to a policy.
 */
export async function addRule(policyId: string, input: CreateRuleInput): Promise<Policy | null> {
  const policy = await getPolicy(policyId)
  if (!policy) return null

  const rule: PolicyRule = {
    id: generateId(),
    checkName: input.checkName,
    targetSeverity: input.targetSeverity,
    reason: input.reason,
    createdAt: Date.now(),
    createdBy: input.createdBy,
  }

  const updated: Policy = {
    ...policy,
    rules: [...policy.rules, rule],
    updatedAt: Date.now(),
  }

  await kvSet(policyKey(policyId), updated)
  return updated
}

/**
 * Remove a rule from a policy.
 */
export async function removeRule(policyId: string, ruleId: string): Promise<Policy | null> {
  const policy = await getPolicy(policyId)
  if (!policy) return null

  const updated: Policy = {
    ...policy,
    rules: policy.rules.filter(r => r.id !== ruleId),
    updatedAt: Date.now(),
  }

  await kvSet(policyKey(policyId), updated)
  return updated
}

/**
 * Update a rule within a policy.
 */
export async function updateRule(
  policyId: string,
  ruleId: string,
  input: Partial<CreateRuleInput>
): Promise<Policy | null> {
  const policy = await getPolicy(policyId)
  if (!policy) return null

  const ruleIndex = policy.rules.findIndex(r => r.id === ruleId)
  if (ruleIndex === -1) return null

  const updatedRule: PolicyRule = {
    ...policy.rules[ruleIndex],
    checkName: input.checkName ?? policy.rules[ruleIndex].checkName,
    targetSeverity: input.targetSeverity ?? policy.rules[ruleIndex].targetSeverity,
    reason: input.reason !== undefined ? input.reason : policy.rules[ruleIndex].reason,
  }

  const updatedRules = [...policy.rules]
  updatedRules[ruleIndex] = updatedRule

  const updated: Policy = {
    ...policy,
    rules: updatedRules,
    updatedAt: Date.now(),
  }

  await kvSet(policyKey(policyId), updated)
  return updated
}
