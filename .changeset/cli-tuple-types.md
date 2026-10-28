---
'expo-modules-cli': patch
---

`generate-types` now renders Swift tuples: an unlabeled tuple as a TypeScript tuple, such as `[number, string]`, and a labeled tuple as an object type, such as `{ x: number; y: number }`. It reads the `scan-exports` schema version 10 of `expo-modules-macros` 0.27.0.
