/**
 * Contract tests for the /scan API endpoint.
 *
 * These tests validate that both recorded and synthetic responses conform
 * to the JSON Schema contract defined in schemas/scan-contract.schema.json.
 *
 * If soroban-guard-core changes its response shape in a way that breaks
 * this frontend, these tests will fail — serving as an early warning.
 */
import Ajv, { ValidateFunction } from 'ajv'
import schema from '@/schemas/scan-contract.schema.json'
import type { Finding, ScanRequest, ScanResponse } from '@/types/findings'

const ajv = new Ajv({ strict: true, allErrors: true })

// Add the full schema so $ref works
ajv.addSchema(schema)

// Compile validators from the schema definitions
const validateFinding: ValidateFunction = ajv.compile({ $ref: `${schema.$id}#/definitions/Finding` })
const validateScanRequest: ValidateFunction = ajv.compile({ $ref: `${schema.$id}#/definitions/ScanRequest` })
const validateScanResponse: ValidateFunction = ajv.compile({ $ref: `${schema.$id}#/definitions/ScanResponse` })
const validateErrorResponse: ValidateFunction = ajv.compile({ $ref: `${schema.$id}#/definitions/ErrorResponse` })
const validateSeverity: ValidateFunction = ajv.compile({ $ref: `${schema.$id}#/definitions/Severity` })

// ============================================================================
// Fixtures: recorded or representative responses from soroban-guard-core
// ============================================================================

const FIXTURES = {
  /**
   * A typical scan response with multiple findings across severity levels.
   * Recorded from soroban-guard-core v0.1.0 on 2025-01-15.
   */
  typicalFindings: {
    findings: [
      {
        check_name: 'unchecked-auth',
        severity: 'Critical',
        file_path: 'src/lib.rs',
        line: 42,
        function_name: 'transfer',
        description: 'Authorization is not verified before executing privileged operation.',
        remediation: 'Add require_auth() call before the transfer.',
      },
      {
        check_name: 'integer-overflow',
        severity: 'High',
        file_path: 'src/lib.rs',
        line: 85,
        function_name: 'add_balance',
        description: 'Integer overflow possible in balance calculation.',
      },
      {
        check_name: 'missing-panic-handler',
        severity: 'Medium',
        file_path: 'src/lib.rs',
        line: 1,
        function_name: 'init',
        description: 'Contract does not define a custom panic handler.',
      },
      {
        check_name: 'unused-return-value',
        severity: 'Low',
        file_path: 'src/utils.rs',
        line: 23,
        function_name: 'helper',
        description: 'Return value is ignored.',
      },
      {
        check_name: 'todo-comment',
        severity: 'Info',
        file_path: 'src/lib.rs',
        line: 100,
        function_name: 'placeholder',
        description: 'TODO comment found in code.',
      },
    ],
  } satisfies ScanResponse,

  /**
   * A clean contract with no findings.
   */
  cleanContract: {
    findings: [],
  } satisfies ScanResponse,

  /**
   * Single finding with minimal required fields (no remediation).
   */
  minimalFinding: {
    findings: [
      {
        check_name: 'test-check',
        severity: 'Info',
        file_path: 'test.rs',
        line: 1,
        function_name: 'test',
        description: 'Test description.',
      },
    ],
  } satisfies ScanResponse,

  /**
   * Valid scan request payloads.
   */
  validRequests: [
    { source: 'fn main() { /* contract code */ }' },
    { source: 'https://github.com/user/repo' },
    { source: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM' },
  ] satisfies ScanRequest[],

  /**
   * Error response shapes for various error conditions.
   */
  errorResponses: {
    badRequest: { error: 'Invalid source format' },
    notFound: { error: 'Contract not found' },
    rateLimited: { error: 'Rate limited' },
    serverError: { error: 'Internal server error' },
    unauthorized: { error: 'Unauthorized' },
  },
}

// ============================================================================
// Contract Tests: ScanResponse (successful responses)
// ============================================================================

describe('ScanResponse contract', () => {
  it('validates a response with multiple findings across all severity levels', () => {
    const valid = validateScanResponse(FIXTURES.typicalFindings)
    expect(validateScanResponse.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('validates a clean contract response (empty findings array)', () => {
    const valid = validateScanResponse(FIXTURES.cleanContract)
    expect(validateScanResponse.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('validates a response with a single minimal finding', () => {
    const valid = validateScanResponse(FIXTURES.minimalFinding)
    expect(validateScanResponse.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('rejects response missing required "findings" field', () => {
    const invalid = {}
    const valid = validateScanResponse(invalid)
    expect(valid).toBe(false)
    expect(validateScanResponse.errors).toContainEqual(
      expect.objectContaining({ keyword: 'required', params: { missingProperty: 'findings' } })
    )
  })

  it('rejects response with findings as non-array', () => {
    const invalid = { findings: 'not an array' }
    const valid = validateScanResponse(invalid)
    expect(valid).toBe(false)
    expect(validateScanResponse.errors).toContainEqual(
      expect.objectContaining({ keyword: 'type', instancePath: '/findings' })
    )
  })

  it('rejects response with additional unexpected properties', () => {
    const invalid = { findings: [], extra: 'field' }
    const valid = validateScanResponse(invalid)
    expect(valid).toBe(false)
    expect(validateScanResponse.errors).toContainEqual(
      expect.objectContaining({ keyword: 'additionalProperties' })
    )
  })
})

// ============================================================================
// Contract Tests: Finding
// ============================================================================

describe('Finding contract', () => {
  it.each(FIXTURES.typicalFindings.findings)('validates finding: $check_name ($severity)', (finding) => {
    const valid = validateFinding(finding)
    expect(validateFinding.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('validates finding with optional remediation field', () => {
    const finding: Finding = {
      check_name: 'test',
      severity: 'High',
      file_path: 'src/lib.rs',
      line: 10,
      function_name: 'fn_name',
      description: 'A vulnerability.',
      remediation: 'Fix it like this.',
    }
    const valid = validateFinding(finding)
    expect(validateFinding.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('validates finding without optional remediation field', () => {
    const finding: Finding = {
      check_name: 'test',
      severity: 'Medium',
      file_path: 'src/lib.rs',
      line: 5,
      function_name: 'fn_name',
      description: 'A warning.',
    }
    const valid = validateFinding(finding)
    expect(validateFinding.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('rejects finding missing required field "check_name"', () => {
    const invalid = {
      severity: 'High',
      file_path: 'test.rs',
      line: 1,
      function_name: 'test',
      description: 'desc',
    }
    const valid = validateFinding(invalid)
    expect(valid).toBe(false)
    expect(validateFinding.errors).toContainEqual(
      expect.objectContaining({ keyword: 'required', params: { missingProperty: 'check_name' } })
    )
  })

  it('rejects finding with invalid severity value', () => {
    const invalid = {
      check_name: 'test',
      severity: 'SuperHigh', // not in enum
      file_path: 'test.rs',
      line: 1,
      function_name: 'test',
      description: 'desc',
    }
    const valid = validateFinding(invalid)
    expect(valid).toBe(false)
    expect(validateFinding.errors).toContainEqual(
      expect.objectContaining({ keyword: 'enum', instancePath: '/severity' })
    )
  })

  it('rejects finding with line number less than 1', () => {
    const invalid = {
      check_name: 'test',
      severity: 'Low',
      file_path: 'test.rs',
      line: 0, // must be >= 1
      function_name: 'test',
      description: 'desc',
    }
    const valid = validateFinding(invalid)
    expect(valid).toBe(false)
    expect(validateFinding.errors).toContainEqual(
      expect.objectContaining({ keyword: 'minimum', instancePath: '/line' })
    )
  })

  it('rejects finding with non-integer line number', () => {
    const invalid = {
      check_name: 'test',
      severity: 'Low',
      file_path: 'test.rs',
      line: 42.5,
      function_name: 'test',
      description: 'desc',
    }
    const valid = validateFinding(invalid)
    expect(valid).toBe(false)
    expect(validateFinding.errors).toContainEqual(
      expect.objectContaining({ keyword: 'type', instancePath: '/line' })
    )
  })

  it('rejects finding with empty string fields', () => {
    const invalid = {
      check_name: '',
      severity: 'Low',
      file_path: 'test.rs',
      line: 1,
      function_name: 'test',
      description: 'desc',
    }
    const valid = validateFinding(invalid)
    expect(valid).toBe(false)
    expect(validateFinding.errors).toContainEqual(
      expect.objectContaining({ keyword: 'minLength', instancePath: '/check_name' })
    )
  })

  it('rejects finding with additional unexpected properties', () => {
    const invalid = {
      check_name: 'test',
      severity: 'Low',
      file_path: 'test.rs',
      line: 1,
      function_name: 'test',
      description: 'desc',
      extra_field: 'unexpected',
    }
    const valid = validateFinding(invalid)
    expect(valid).toBe(false)
    expect(validateFinding.errors).toContainEqual(
      expect.objectContaining({ keyword: 'additionalProperties' })
    )
  })
})

// ============================================================================
// Contract Tests: ScanRequest
// ============================================================================

describe('ScanRequest contract', () => {
  it.each(FIXTURES.validRequests)('validates request: %o', (request) => {
    const valid = validateScanRequest(request)
    expect(validateScanRequest.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('rejects request missing required "source" field', () => {
    const invalid = {}
    const valid = validateScanRequest(invalid)
    expect(valid).toBe(false)
    expect(validateScanRequest.errors).toContainEqual(
      expect.objectContaining({ keyword: 'required', params: { missingProperty: 'source' } })
    )
  })

  it('rejects request with empty source string', () => {
    const invalid = { source: '' }
    const valid = validateScanRequest(invalid)
    expect(valid).toBe(false)
    expect(validateScanRequest.errors).toContainEqual(
      expect.objectContaining({ keyword: 'minLength', instancePath: '/source' })
    )
  })

  it('rejects request with non-string source', () => {
    const invalid = { source: 12345 }
    const valid = validateScanRequest(invalid)
    expect(valid).toBe(false)
    expect(validateScanRequest.errors).toContainEqual(
      expect.objectContaining({ keyword: 'type', instancePath: '/source' })
    )
  })

  it('rejects request with additional unexpected properties', () => {
    const invalid = { source: 'code', extra: 'field' }
    const valid = validateScanRequest(invalid)
    expect(valid).toBe(false)
    expect(validateScanRequest.errors).toContainEqual(
      expect.objectContaining({ keyword: 'additionalProperties' })
    )
  })
})

// ============================================================================
// Contract Tests: ErrorResponse
// ============================================================================

describe('ErrorResponse contract', () => {
  it.each(Object.entries(FIXTURES.errorResponses))('validates error response: %s', (_name, response) => {
    const valid = validateErrorResponse(response)
    expect(validateErrorResponse.errors).toBeNull()
    expect(valid).toBe(true)
  })

  it('rejects error response missing required "error" field', () => {
    const invalid = {}
    const valid = validateErrorResponse(invalid)
    expect(valid).toBe(false)
    expect(validateErrorResponse.errors).toContainEqual(
      expect.objectContaining({ keyword: 'required', params: { missingProperty: 'error' } })
    )
  })

  it('rejects error response with empty error string', () => {
    const invalid = { error: '' }
    const valid = validateErrorResponse(invalid)
    expect(valid).toBe(false)
    expect(validateErrorResponse.errors).toContainEqual(
      expect.objectContaining({ keyword: 'minLength', instancePath: '/error' })
    )
  })

  it('rejects error response with additional unexpected properties', () => {
    const invalid = { error: 'Something went wrong', code: 500 }
    const valid = validateErrorResponse(invalid)
    expect(valid).toBe(false)
    expect(validateErrorResponse.errors).toContainEqual(
      expect.objectContaining({ keyword: 'additionalProperties' })
    )
  })
})

// ============================================================================
// Contract Tests: Severity enum
// ============================================================================

describe('Severity contract', () => {
  it.each(['Critical', 'High', 'Medium', 'Low', 'Info'])('accepts valid severity: %s', (severity) => {
    expect(validateSeverity(severity)).toBe(true)
  })

  it.each(['critical', 'HIGH', 'warning', 'Error', '', null, 1])('rejects invalid severity: %s', (severity) => {
    expect(validateSeverity(severity)).toBe(false)
  })
})

// ============================================================================
// Type Compatibility: ensure TypeScript types match schema
// ============================================================================

describe('TypeScript type compatibility', () => {
  it('Finding type is compatible with schema-validated objects', () => {
    const schemaFinding = FIXTURES.typicalFindings.findings[0]
    // Type assertion should succeed if types are compatible
    const tsFinding: Finding = schemaFinding
    expect(tsFinding.check_name).toBe('unchecked-auth')
  })

  it('ScanResponse type is compatible with schema-validated objects', () => {
    const schemaResponse = FIXTURES.typicalFindings
    const tsResponse: ScanResponse = schemaResponse
    expect(tsResponse.findings).toHaveLength(5)
  })

  it('ScanRequest type is compatible with schema-validated objects', () => {
    const schemaRequest = FIXTURES.validRequests[0]
    const tsRequest: ScanRequest = schemaRequest
    expect(tsRequest.source).toBeDefined()
  })
})
