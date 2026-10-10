---
'expo-sqlite': patch
---

Create native database connections through a module factory instead of the `NativeDatabase` constructor, so iOS can define `NativeDatabase` entirely with the Expo Modules API 2.0 macros.
