---
"expo-sqlite": patch
---

On iOS, a failed `run()` resets the statement after `SQLITE_BUSY`, so a later transaction on that connection can commit.
