---
'expo-modules-jsi': patch
---

[iOS] Speed up integer arguments and results of native functions by running the integer conversions specialized inside `ExpoModulesJSI` instead of unspecialized in the calling module. A host function that adds two `Int`s runs about 7× faster.
