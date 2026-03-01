# Cultural Boundary Enforcement

## Purpose

This document defines the cultural boundary that protects Māori protocols and concepts within MauriMesh.

## Boundary Rules

### INTERNAL (Rust Core) - ALLOWED
- TikangaMauri enum and state machine
- Māori protocol names
- Cultural concept documentation
- Māori term usage in code comments

### EXTERNAL (UI/Network/FFI) - FORBIDDEN
- No Māori terms in FFI exports
- No Māori terms in network payloads
- No Māori terms in UI strings
- No Māori terms in logs visible to users

## Enforcement

1. **Automated Audit**: `scripts/audit-isolation.ps1`
2. **Build Check**: Fails if violations detected
3. **CI/CD**: Blocks PRs with violations
4. **Manual Review**: Required for boundary changes

## Violations

| Severity | Response |
|----------|----------|
| Critical | Block build, immediate fix |
| High | Fix within 24 hours |
| Medium | Fix within 7 days |
| Low | Document and schedule |

## Contact

cultural-governance@maurimesh.io
