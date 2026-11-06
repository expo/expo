---
'expo-modules-core': patch
'expo-modules-test-core': patch
---

[iOS] Fix app contexts that own their runtime, such as the ones in unit tests, never being deallocated.
