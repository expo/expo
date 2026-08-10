---
'expo-local-authentication': patch
---

[Android] Fix `authenticateAsync` crashing on Android 9 and 10 when `biometricsSecurityLevel` is set to `'strong'` and the device credential fallback is enabled. On those Android versions the security level now automatically falls back to `'weak'` (the system cannot combine strong biometrics with device credentials in a single prompt there), and the successful result contains a `warning` reporting the downgrade.
