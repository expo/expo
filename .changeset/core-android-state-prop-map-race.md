---
'expo-modules-core': patch
---

[Android] Fixed a data race on the Fabric view state-prop map when Expo registers its view components while React Native builds a component descriptor registry on another thread.
