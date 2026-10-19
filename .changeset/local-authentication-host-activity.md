---
'expo-local-authentication': patch
---

Report an actionable error on Android when the host Activity does not extend `FragmentActivity`, which the biometric prompt needs. The module declares the requirement for its authentication prompts, so Core logs a warning at startup that names them, and `authenticateAsync` rejects with `ERR_UNSUPPORTED_HOST_ACTIVITY`. The capability queries keep working on every host.
