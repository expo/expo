---
'expo-updates': patch
---

Record log entry timestamps with millisecond precision on iOS, and log errors handled by error recovery with the `JSRuntimeError` code on Android. On iOS, emergency launch and initialization errors are now logged with the `InitializationError` code instead of `JSRuntimeError`.
