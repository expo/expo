---
'expo-modules-core': patch
---

[Android] Fix native memory that grew with each module class under Hermes V1, by about 0.57 MiB per class on React Native 0.86 and 0.87 and about 93 KiB on 0.88. `createClass` evaluated a new JavaScript source for each class, and Hermes keeps memory for every evaluated source until the runtime is destroyed. It now evaluates one class factory for each runtime and calls it for each class. On iOS, this code creates only the four base classes (`SharedObject`, `SharedRef`, `EventEmitter` and `NativeModule`).
