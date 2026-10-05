---
'@expo/cli': patch
'@expo/metro-config': patch
'babel-preset-expo': patch
---

Pick up edits to `app.json` and `app.config.*` in the Expo config inlined for `process.env.APP_MANIFEST` (read by `expo-constants`) on web while `expo start` is running, without restarting or clearing the cache.
