---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptObject.tryUnsetNativeState()`, which returns `false` when the native state can't be removed, for example from a frozen object. `unsetNativeState()` now ignores that case instead of raising a C++ exception that Swift can't catch.
