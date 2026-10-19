# History

## 2026-10-19 07:59 PDT — ENG-28339 minimal proof of concept
**Asked:** Implement and push a minimal PoC restoring child query params in layout `useLocalSearchParams`.
**Did / why:** Derive raw params from the layout's selected child navigation state inside the hook, then use the existing decoder. Keeping the derivation out of the shared provider avoids extra renders through internal guard consumers. No state snapshot, focus subscription, or navigation-state mutation is needed. Added regression coverage for initial URLs, replacement, updates/removal, encoding, retained layouts, and preloads. All three new cases failed before implementation; the local/global hook suites pass afterward (19 tests), as do typecheck and lint. This is a PoC, not the full SDK 57 compatibility and platform verification described in the plan. No UI or native code changed; no simulator screenshots were taken.

**Verification:** `et check-packages expo-router` passed: build, typecheck, dependency checks, lint, formatting, and 460 test suites (5,995 tests passed; 9 skipped).
