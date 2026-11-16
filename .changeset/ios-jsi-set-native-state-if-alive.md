---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptObject.setNativeStateIfAlive(_:)`, which attaches a native state only while another JS object holds it. It never creates a new C++ native state.
