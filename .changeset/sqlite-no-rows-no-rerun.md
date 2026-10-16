---
'expo-sqlite': patch
---

Fix reading a result without rows running its statement again. Iterating such a result, or calling `getFirstSync()` or `getFirstAsync()` on it, stepped the finished statement, which SQLite then runs again, so a write was applied twice.
