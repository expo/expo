---
'expo-modules-jsi': patch
---

[iOS] Fix native memory growth under Hermes V1 for each class created with `JavaScriptRuntime.createClass`, of about 0.57 MiB per class on React Native 0.86 and 0.87 and about 93 KiB on 0.88. `createClass` now evaluates one class factory per runtime instead of a new JavaScript source for each class, because Hermes keeps memory for every evaluated source until the runtime is destroyed.
