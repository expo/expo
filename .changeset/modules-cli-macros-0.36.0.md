---
'expo-modules-cli': patch
---

Read the `scan-exports` schema of `expo-modules-macros` 0.36.0, which `expo-modules-core` depends on. A member bound under a well-known symbol renders as `[Symbol.iterator]`, and one bound under `Symbol.for` is skipped with a warning.
