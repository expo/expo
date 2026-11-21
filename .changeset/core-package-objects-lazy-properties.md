---
'expo-modules-core': patch
---

[iOS] Make the package objects of `expo.packages` plain objects with a lazy property for each export, so reading an export after the first read doesn't call native code.
