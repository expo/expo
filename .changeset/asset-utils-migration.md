---
'@expo/cli': patch
'expo-updates': patch
---

Resolve Android resource names and `drawable-*` folders with `@react-native/asset-utils`, matching how React Native resolves embedded assets at runtime. Scales outside the standard set map to a `drawable-<n>dpi` folder instead of failing the export, and assets referenced through `?unstable_path=` drop that prefix from their resource name.
