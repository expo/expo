---
'expo-modules-jsi': patch
---

[iOS] Write the generated `jsi` module map under `EXPO_CUSTOM_BUILD_ROOT` when it is set, so a custom build writes nothing into the package directory. Without it, the module map stays at `apple/.generated/module.modulemap`.
