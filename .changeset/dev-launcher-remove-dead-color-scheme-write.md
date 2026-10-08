---
'expo-dev-launcher': patch
---

[Android] Removed a reflective write to an `AppearanceModule` field that no longer exists, which logged a warning every time an app was loaded.
