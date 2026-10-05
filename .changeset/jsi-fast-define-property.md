---
'expo-modules-jsi': patch
---

[iOS] Speed up `JavaScriptObject.defineProperty` by looking up `Object.defineProperty` once per runtime and building the descriptor in C++.
