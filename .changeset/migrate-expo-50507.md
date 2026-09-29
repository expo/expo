---
"expo": patch
---

[Web] Stub `requestAnimationFrame` in server bundles, where `react-native-worklets` 0.12 calls it unguarded when Reanimated is imported, crashing server rendering and `expo export`.

See: [#50507](https://github.com/expo/expo/pull/50507)
