---
'expo-modules-core': patch
---

[Android] Add `AppContext.storageContext`, the Android context for app storage. In Expo Go it is scoped to the running experience, so Expo Modules v2 modules can keep shared preferences per experience through `legacyAppContext`.
