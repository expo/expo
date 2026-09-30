---
'expo-sqlite': patch
---

[Android][iOS] Keep connections usable and cached after a failed close, allowing statement cleanup and another close attempt.

[Android][iOS] Mark statements as finalized even when SQLite returns an earlier execution error, preventing access to freed statements.

[Android][iOS] Invalidate statement wrappers during automatic close cleanup and synchronize preparation and finalization with cleanup.

[Android] Keep prepared statement bindings alive until finalization, including after JavaScript releases the statement.
