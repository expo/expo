---
'expo-modules-jsi': patch
---

[iOS] Fix blocking `JavaScriptRuntime.execute` calls using a full CPU core while they wait for the JavaScript thread.
