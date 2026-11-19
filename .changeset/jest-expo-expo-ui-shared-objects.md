---
'jest-expo': patch
---

Mock the `ObservableState` and `WorkletCallback` classes of `@expo/ui`. Before, tests that rendered a component using `useNativeState` or `withAnimation`, such as `PagerView`, failed with `ExpoUI.ObservableState is not a constructor`.
