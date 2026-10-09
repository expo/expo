---
'expo-modules-core': patch
---

[iOS] Throw when JavaScript constructs a shared object class that has no way to build its native instance, instead of returning an object that fails at its first member access.
