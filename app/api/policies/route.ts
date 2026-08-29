import { NextRequest, NextResponse } from 'next/server'
import { listPolicies, createPolicy } from '@/lib/policy'
import { requireApiKey } from '@/lib/apiAuth'
import type { CreatePolicyInput } from '@/types/policy'

/**
 * GET /api/policies - List all policies
 */
export async function GET(req: NextRequest) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const policies = await listPolicies()
    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Failed to list policies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/policies - Create a new policy
 */
export async function POST(req: NextRequest) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, description, owner } = body as CreatePolicyInput

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Policy name is required' }, { status: 400 })
    }

    const policy = await createPolicy({
      name: name.trim(),
      description: description?.trim(),
      owner,
    })

    return NextResponse.json({ policy }, { status: 201 })
  } catch (error) {
    console.error('Failed to create policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
