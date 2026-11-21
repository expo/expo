---
'expo-modules-core': patch
---

Fix "No matching export" errors when esbuild bundles `expo-modules-core`. The `ts-declarations/global` module no longer imports the type-only `EventEmitter`, `NativeModule`, `SharedObject`, and `SharedRef` modules at runtime.
