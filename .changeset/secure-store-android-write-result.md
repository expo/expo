---
'expo-secure-store': patch
---

[Android] Reject `setItemAsync` when the encrypted item did not reach disk, instead of resolving as if it had. `SharedPreferences` updates its in-memory map before it attempts the write, so the previously stored value is restored before rejecting and a read taken after a rejected write returns what is actually persisted.
