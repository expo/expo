---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptUnownedValue` `@frozen`, so modules that decode `@JS` function arguments know its layout and no longer ask its type metadata for it. Host functions with arguments are faster, by about 8 to 12% with eight arguments. This changes the ABI of `ExpoModulesJSI`.
