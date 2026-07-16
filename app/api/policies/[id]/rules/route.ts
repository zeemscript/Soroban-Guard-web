import { NextRequest, NextResponse } from 'next/server'
import { addRule, removeRule } from '@/lib/policy'
import { requireApiKey } from '@/lib/apiAuth'
import type { CreateRuleInput } from '@/types/policy'
import type { Severity } from '@/types/findings'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VALID_SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

/**
 * POST /api/policies/[id]/rules - Add a rule to a policy
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await req.json()
    const { checkName, targetSeverity, reason, createdBy } = body as CreateRuleInput

    if (!checkName || typeof checkName !== 'string' || checkName.trim().length === 0) {
      return NextResponse.json({ error: 'Check name is required' }, { status: 400 })
    }

    if (!targetSeverity || !VALID_SEVERITIES.includes(targetSeverity)) {
      return NextResponse.json(
        { error: `Target severity must be one of: ${VALID_SEVERITIES.join(', ')}` },
        { status: 400 }
      )
    }

    const policy = await addRule(id, {
      checkName: checkName.trim(),
      targetSeverity,
      reason: reason?.trim(),
      createdBy,
    })

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    return NextResponse.json({ policy }, { status: 201 })
  } catch (error) {
    console.error('Failed to add rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/policies/[id]/rules - Remove a rule from a policy
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const { id } = await params
    const ruleId = req.nextUrl.searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const policy = await removeRule(id, ruleId)

    if (!policy) {
      return NextResponse.json({ error: 'Policy or rule not found' }, { status: 404 })
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error('Failed to remove rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
