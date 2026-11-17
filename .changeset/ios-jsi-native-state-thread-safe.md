---
'expo-modules-jsi': patch
---

[iOS] Make attaching a `JavaScriptNativeState` thread-safe, so JS objects of several runtimes can share one native state. Add `JavaScriptObject.setNativeStateIfAlive(_:)`, which attaches a native state only while another JS object holds it.
