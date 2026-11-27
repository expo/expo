---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptObject.PropertyOptions` frozen, so an options literal in another module, such as `[.configurable, .enumerable]`, no longer costs about 150 ns to 210 ns for each call.
