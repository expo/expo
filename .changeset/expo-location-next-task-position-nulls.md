---
'expo-location': patch
---

[Android] Deliver `null` instead of `undefined` for absent `Position` fields in positions that reach a background task through `expo-task-manager`, matching `getPosition` and the `Position` type.
