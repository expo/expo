---
'expo-modules-core': patch
---

Added the `Callback` argument type so native module functions can call a JavaScript function any number of times from any thread. On iOS, this replaces the unused `AnyCallback` protocol and `Callback<ArgType>` class.
