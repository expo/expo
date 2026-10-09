---
'expo-module-template': patch
'create-expo-module': patch
---

Fixed the example app bundling a second copy of `react-native` and `expo` from the module's dependencies, which crashed it with `TypeError: property is not writable` when the module was created with pnpm. The example app now enables `experiments.autolinkingModuleResolution`.
