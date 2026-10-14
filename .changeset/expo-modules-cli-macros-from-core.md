---
'expo-modules-cli': minor
---

Scan with the `expo-modules-macros` version that `expo-modules-core` depends on, found through the `expo` package of the scanned package, instead of a copy of its own. `expo` is now a peer dependency. The CLI reads the `scan-exports` schema of `expo-modules-macros` 0.20.0, and declares enums, records, and unions nested in other types under their own names.
