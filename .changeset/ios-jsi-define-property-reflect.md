---
'expo-modules-jsi': patch
---

[iOS] Fix a crash in `JavaScriptObject.defineProperty` when the object doesn't accept the property, for example when it's frozen. It now uses `Reflect.defineProperty`, and the object stays unchanged.
