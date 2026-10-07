---
'expo-sqlite': patch
---

[iOS] Fixed opening databases whose path contains whitespace, non-ASCII characters, `#` or `?`, both as plain paths and as `file://` URIs such as App Group containers.

[iOS] `importDatabaseFromAssetAsync` with `forceOverwrite` now removes the `-journal`, `-wal` and `-shm` files with the old database, so a stale write-ahead log is no longer replayed over the imported copy and repeat calls on a `file://` path no longer fail.

[iOS] On the first open, a database that an earlier release created under a percent-encoded name on iOS 17 and later is moved to the decoded path, together with its `-journal`, `-wal` and `-shm` files.
