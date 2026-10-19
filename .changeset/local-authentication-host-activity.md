---
'expo-local-authentication': patch
---

Report an actionable error on Android when the host Activity does not extend `FragmentActivity`, which the biometric prompt needs. The module declares the requirement, so Core logs it at startup, and `authenticateAsync` rejects with `ERR_UNSUPPORTED_HOST_ACTIVITY`.
