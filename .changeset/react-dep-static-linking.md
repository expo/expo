---
'expo-modules-autolinking': patch
---

[iOS] Fixed `pod install` failing with precompiled modules and `useFrameworks: "dynamic"` when a pod depends on React only through `React`, `ReactCommon`, or another pod that depends on them ([#50640](https://github.com/expo/expo/issues/50640)).
