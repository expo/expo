---
"expo-sqlite": patch
---

[Android][iOS] Keep connections usable and cached after a failed close, allowing statement cleanup and another close attempt.

[Android][iOS] Mark statements as finalized even when SQLite returns an earlier execution error, preventing access to freed statements.
