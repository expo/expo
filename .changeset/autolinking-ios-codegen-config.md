---
'expo-modules-autolinking': patch
---

[iOS] Pass Expo modules that have a `codegenConfig` to React Native codegen. The `expo-media-library` image loader for `ph://` URIs is registered again, so `<Image source={{ uri: 'ph://...' }}>` loads in React Native 0.83 and later.
