---
"expo-module-scripts": patch
---

[Internal] Disallow runtime dependencies on `@expo/metro` outside `@expo/metro-config`, `@expo/cli` and `expo` in `depscheck`, and drop the unused `@expo/metro` devDependency.

See: [#50651](https://github.com/expo/expo/pull/50651)
