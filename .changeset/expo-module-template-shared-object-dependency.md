---
'expo-module-template': patch
---

Import `SharedObject` and `useReleasingSharedObject` from `expo` instead of `expo-modules-core`, so standalone modules that use `SharedObject` build when installed outside an Expo app.
