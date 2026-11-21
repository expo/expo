---
'expo-router': patch
---

Type-check against React Native's generated TypeScript types. `headerLargeTitleStyle` takes `fontWeight` from `TextStyle`, like `headerTitleStyle`, and refs use React Native's component instance types, such as `ViewInstance` and `PressableInstance`.
