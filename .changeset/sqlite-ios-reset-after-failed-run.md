---
'expo-sqlite': patch
---

[iOS] Fix every later transaction on a connection failing with `cannot commit transaction - SQL statements in progress` after a statement fails with `database is locked`, by resetting the statement when its run fails.
