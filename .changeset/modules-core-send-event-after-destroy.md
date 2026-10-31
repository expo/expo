---
'expo-modules-core': patch
---

[Android] Drop events that a module sends after its app context is destroyed, instead of throwing `IllegalArgumentException`. This prevents crashes when a native callback fires after a JavaScript reload.
