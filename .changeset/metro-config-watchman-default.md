---
'@expo/metro-config': patch
---

`getDefaultConfig` sets `resolver.useWatchman` to `false` in place of `null`. Expo CLI still uses the Node watcher unless `resolver.useWatchman: true` is set, and tools that start Metro without Expo CLI, such as `react-native start`, now use it by default too.
