---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptUnownedValue` `@frozen`, so modules that decode `@JS` function arguments know its layout and no longer ask its type metadata for it. Host functions that take numbers or strings are about 4% faster. This changes the ABI of `ExpoModulesJSI`.
