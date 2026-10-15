---
'expo-modules-jsi': patch
---

[iOS] Fix native memory that grew by about 0.57 MiB for each class created with `JavaScriptRuntime.createClass` with Hermes V1. It evaluated a new JavaScript source for each class, and Hermes keeps memory for every evaluated source until the runtime is destroyed. It now evaluates one class factory for each runtime and calls it for each class.
