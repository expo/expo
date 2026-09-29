---
"expo-module-scripts": patch
---

Fix `prepublishOnly` wiping `build/` for packages that compile with `expo-build`, by rebuilding via the package's own `build` script instead of `tsc`.

See: [#47344](https://github.com/expo/expo/pull/47344)
