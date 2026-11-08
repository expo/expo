---
'expo-sqlite': patch
---

Fix closing a database with many unfinalized statements taking quadratic time when `finalizeUnusedStatementsBeforeClosing` is on. With 20 000 statements, `closeSync()` took about 2 s and could block the main thread on app reload.
