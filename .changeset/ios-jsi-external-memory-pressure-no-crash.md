---
'expo-modules-jsi': patch
---

[iOS] Fix a crash in `JavaScriptObject.setExternalMemoryPressure(_:)` when the runtime rejects the amount, for example an amount above 4 GB. The amount is now ignored.
