import type { Finding, Severity } from '@/types/findings'
import type { Policy } from '@/types/policy'

/**
 * A finding with optional policy-applied metadata.
 * When a policy remaps the severity, originalSeverity is set to the scanner's assessment.
 */
export interface PolicyAppliedFinding extends Finding {
  originalSeverity?: Severity    // Set when policy remapped severity
  policyRuleId?: string          // Which rule was applied
  policyName?: string            // Name of the policy that applied the rule
}

/**
 * Apply a policy to findings, remapping severities based on rules.
 *
 * @param findings - Raw findings from the scanner
 * @param policy - Optional policy to apply (null means no remapping)
 * @returns Findings with policy-applied metadata
 */
export function applyPolicy(
  findings: Finding[],
  policy: Policy | null
): PolicyAppliedFinding[] {
  if (!policy || policy.rules.length === 0) {
    // No policy or no rules - return findings as-is
    return findings.map(f => ({ ...f }))
  }

  // Build a lookup map for quick rule matching by check_name
  const rulesByCheckName = new Map<string, { ruleId: string; targetSeverity: Severity }>()
  for (const rule of policy.rules) {
    // If multiple rules target the same check_name, the last one wins
    rulesByCheckName.set(rule.checkName, {
      ruleId: rule.id,
      targetSeverity: rule.targetSeverity,
    })
  }

  return findings.map(finding => {
    const rule = rulesByCheckName.get(finding.check_name)

    if (rule && rule.targetSeverity !== finding.severity) {
      // Policy remaps this finding's severity
      return {
        ...finding,
        severity: rule.targetSeverity,
        originalSeverity: finding.severity,
        policyRuleId: rule.ruleId,
        policyName: policy.name,
      }
    }

    // No matching rule or severity already matches
    return { ...finding }
  })
}

/**
 * Check if a finding has been modified by a policy.
 */
export function isPolicyModified(finding: PolicyAppliedFinding): boolean {
  return finding.originalSeverity !== undefined
}

/**
 * Get the original (scanner) severity for a finding.
 * Returns the current severity if not modified by policy.
 */
export function getOriginalSeverity(finding: PolicyAppliedFinding): Severity {
  return finding.originalSeverity ?? finding.severity
}

/**
 * Count findings by severity, using policy-applied severities.
 */
export function countBySeverity(findings: PolicyAppliedFinding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Info: 0,
  }

  for (const finding of findings) {
    counts[finding.severity]++
  }

  return counts
}

/**
 * Count findings by original (scanner) severity, ignoring policy remaps.
 */
export function countByOriginalSeverity(findings: PolicyAppliedFinding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Info: 0,
  }

  for (const finding of findings) {
    const severity = getOriginalSeverity(finding)
    counts[severity]++
  }

  return counts
}
