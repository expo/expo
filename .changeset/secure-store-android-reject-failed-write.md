---
'expo-secure-store': patch
---

[Android] Fix `setItemAsync` resolving when the value was not written to disk. A write or delete that does not reach disk no longer changes the value that later reads return.
