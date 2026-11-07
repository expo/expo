---
'expo-router': patch
---

Fix `expo-router/testing-library` throwing `jest is not defined` when imported under a test runner other than Jest. The Jest module mocks and `renderRouter`'s fake timers now run only when the `jest` global exists; the runner still needs a Jest-compatible global `expect` for the matchers.
