---
'jest-expo': patch
---

Mock the copy of `expo-modules-core` that `expo` resolves, so a second copy elsewhere in `node_modules` is not left unmocked.
