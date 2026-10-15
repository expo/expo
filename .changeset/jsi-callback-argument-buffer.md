---
'expo-modules-jsi': patch
---

[iOS] Make calling a `JavaScriptCallback` with arguments faster. The arguments are encoded straight into the arguments buffer without a reference and a copy each, and the function is no longer copied on every call.
