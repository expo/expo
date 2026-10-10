---
'expo-sqlite': patch
---

[iOS] Fixed database paths with whitespace, non-ASCII characters, `#` or `?`, both as plain paths and as `file://` URIs such as App Group containers. `importDatabaseFromAssetAsync` with `forceOverwrite` now also removes the `-journal`, `-wal` and `-shm` files so a stale write-ahead log is not replayed over the imported copy, and a database that an earlier release created under a percent-encoded name on iOS 17, tvOS 17 or macOS 14 and later is moved to the decoded path on first open.
