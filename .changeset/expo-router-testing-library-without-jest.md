---
'expo-router': patch
---

Make `expo-router/testing-library` importable without Jest. Its module mocks and `renderRouter`'s fake timers now run only when a `jest` global exists, the way `@testing-library/react-native` detects Jest; under another runner the module imports and renders on real timers.
