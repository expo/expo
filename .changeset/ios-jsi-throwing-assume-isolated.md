---
'expo-modules-jsi': patch
---

[iOS] Reduce the overhead of `JavaScriptActor.assumeIsolated` with a throwing closure, and of blocking `JavaScriptCallback` calls on the JavaScript thread. The throwing `assumeIsolated` now throws untyped errors.
