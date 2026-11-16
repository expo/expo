---
'expo-modules-core': patch
---

[iOS] Keep the native state and the ID of a shared object while a JS object of any runtime holds it, so `release()` releases a shared object that a worklet returns to the main runtime in all runtimes. Remove the event listeners of a released shared object that a worklet still holds before the main runtime is destroyed.
