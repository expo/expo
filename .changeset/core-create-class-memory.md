---
'expo-modules-core': patch
---

[Android][iOS] Fix native memory that grew by about 0.57 MiB for each class a module defines with Hermes V1. `createClass` evaluated a new JavaScript source for each class, and Hermes keeps memory for every evaluated source until the runtime is destroyed. It now evaluates one class factory for each runtime and calls it for each class.
