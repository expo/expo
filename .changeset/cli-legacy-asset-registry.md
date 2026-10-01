---
'@expo/cli': patch
---

Resolve the legacy `react-native/Libraries/Image/AssetRegistry` import to the shared asset registry. React Native 0.87 removed this module, which broke libraries that still import it, such as `@shopify/react-native-skia` on web.
