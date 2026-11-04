---
"expo-modules-jsi": patch
---

[iOS] Fix a crash on iOS 17 and older ("freed pointer was not the last allocation") when an async native function awaits `JavaScriptRuntime.execute` on the JavaScript thread.
