---
'@expo/cli': patch
'@expo/metro-config': patch
'babel-preset-expo': patch
---

Fix `expo export` reusing cached transforms with a stale inlined Expo config on web. `process.env.APP_MANIFEST` (read by `expo-constants`) now varies the transform cache on the public Expo config, so changing a dynamic config value such as `extra` no longer requires `--clear`.
