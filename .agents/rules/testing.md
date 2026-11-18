---
trigger: always_on
---

# Testing Guidelines

## Test Runner & Placement

- Use Bun's built-in test runner (`bun test`).
- Place module tests alongside the feature (`src/modules/<feature>/*.test.ts`) or in `tests/`, keeping test helpers local to each test file unless genuinely shared.

## Integrity & Verification (LLM Guardrails)

- **Fix code, not tests**: Never weaken assertions, add `.skip`, or alter expected behavior just to make a failing test pass when the implementation has a bug.
- **Verify after final edits**: Always run the relevant `bun test` suite after your last edit and report exact results—never claim tests pass based on assumptions or stale runs.
- **Regression tests for bug fixes**: When fixing a bug, include a test that reproduces the failure case and confirms the fix.

## What to Test & Assertion Quality

- Test observable behavior, validation failures, and edge cases rather than internal implementation details.
- For routes (`index.ts`), verify HTTP status codes, cookies, `HX-Redirect` / `Location` headers, and key HTML/JSX partial output.
- For validation (`model.ts`), test both valid payloads and invalid inputs (confirming Indonesian error messages).
- Use specific assertions (`toEqual`, `toContain`, `toThrow`) instead of generic truthy checks.

## Isolation, Determinism & Database Tests

- Keep tests deterministic and independent: no shared mutable state across test cases, no real external network calls, and no timing-dependent flakiness.
- Test Drizzle queries and `service.ts` logic against an isolated test PostgreSQL database (or transaction rollback)—never against production data.
- Avoid over-mocking: prefer testing real Zod schemas, services, and database queries over mocking core application logic.
