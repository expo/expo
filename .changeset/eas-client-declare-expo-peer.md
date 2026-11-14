---
'expo-eas-client': patch
---

Import `requireNativeModule` from `expo` and declare `expo` as a peer dependency. The package declared no dependencies, so its `expo-modules-core` import resolved only through hoisting.
