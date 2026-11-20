---
'expo-modules-core': patch
---

[iOS] Pair a new shared object with its JS object faster: the native state of the shared object now releases it directly, without an ID lookup in the shared object registry. Creating a shared object is about 6% to 16% faster.
