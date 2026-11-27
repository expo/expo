---
'expo-local-authentication': patch
---

[Android] Fix `authenticateAsync` crashing on Android 9 and 10 when `biometricsSecurityLevel` is `'strong'` and the device fallback is enabled. On those versions, the system can't offer the device's screen lock in the same prompt as strong biometrics, so the prompt now accepts only strong biometrics and shows a button that opens the system's screen lock confirmation. Use `fallbackLabel` to customize the button label. On Android 10, that screen can first offer any biometric the system exposes, so set `disableDeviceFallback: true` to accept only strong biometrics.
