import { NextRequest, NextResponse } from 'next/server'
import { getPolicy, updatePolicy, deletePolicy } from '@/lib/policy'
import { requireApiKey } from '@/lib/apiAuth'
import type { UpdatePolicyInput } from '@/types/policy'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/policies/[id] - Get a single policy
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const { id } = await params
    const policy = await getPolicy(id)

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error('Failed to get policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/policies/[id] - Update a policy
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { name, description } = body as UpdatePolicyInput

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Policy name cannot be empty' }, { status: 400 })
    }

    const policy = await updatePolicy(id, {
      name: name?.trim(),
      description: description !== undefined ? description?.trim() : undefined,
    })

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error('Failed to update policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/policies/[id] - Delete a policy
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const { id } = await params
    const deleted = await deletePolicy(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
