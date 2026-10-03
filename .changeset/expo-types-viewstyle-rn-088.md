---
'expo': patch
---

Fix `StyleProp<ViewStyle>` no longer being assignable to a `View`'s `style` prop (and the reverse) with React Native 0.88 when `expo/types` is referenced, for example through `expo-env.d.ts` with typed routes. The web-only `ViewStyle` augmentation no longer redeclares `position`, `boxSizing`, `backgroundImage`, `backgroundSize`, `backgroundPosition` and `backgroundRepeat`, which React Native now declares itself.
