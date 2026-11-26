---
'@expo/ui': patch
---

Add a Jest mock of the `ExpoUI` native module that `jest-expo` loads. Tests that render a component using `useNativeState` or `withAnimation`, such as `PagerView`, no longer fail with `ExpoUI.ObservableState is not a constructor`. Tests with the Android preset also get the Material 3 size constants and an empty `getMaterialColors` palette.
