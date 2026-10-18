---
'expo-build-properties': patch
'expo-template-bare-minimum': patch
---

Add the `ios.gccOptimizationLevel` option. It sets the `GCC_OPTIMIZATION_LEVEL` build setting of all CocoaPods targets in release build configurations. The default template **Podfile** reads the new `ios.gccOptimizationLevel` key from **Podfile.properties.json**.
