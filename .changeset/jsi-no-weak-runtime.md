---
'expo-modules-jsi': patch
---

[iOS] Remove all `weak` references to `JavaScriptRuntime`, which makes every retain and release of the runtime faster. `JavaScriptRuntime.schedule`, `runOrSchedule` and `execute` now drop the work when the runtime is gone by the time it runs, and `execute` throws `RuntimeLostError` then.
