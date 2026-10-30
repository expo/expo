---
'jest-expo': patch
---

Mock the `AssetRegistry` that `import { AssetRegistry } from 'react-native'` returns, so `expo-asset` and `@expo/vector-icons` no longer fail with `Module "1" is missing from the asset registry`.
