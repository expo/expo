---
"expo-intent-launcher": patch
---

Add a Jest mock for the Android-only `ExpoIntentLauncher` native module, so importing `expo-intent-launcher` under the `jest-expo/android` preset no longer throws `Cannot find native module 'ExpoIntentLauncher'`.
