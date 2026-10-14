---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptUnownedValue` `@frozen`, so modules that decode `@JS` function arguments know its layout and no longer ask its type metadata for it. Each decoded argument costs about 2 to 3 ns less, so a host function with eight arguments is about 8 to 12% faster. This changes the ABI of `ExpoModulesJSI`.
