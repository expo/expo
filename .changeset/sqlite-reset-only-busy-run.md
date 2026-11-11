---
'expo-sqlite': patch
---

[iOS][Android] Fix `finalizeAsync()` and `finalizeSync()` not reporting the earlier error of a failed `run()`, by resetting the statement only when the run fails with `database is locked`.
