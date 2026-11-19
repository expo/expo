---
'jest-expo': patch
---

Mock `addListener` and `removeListeners` on `StatusBarManager`, so components that use React Native's `useVerticalBarEdgeIOS` render in tests.
