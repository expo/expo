---
'expo-sqlite': patch
---

[Web] The SQLite worker now loads its WebAssembly module on the next turn, without opening the database files. A synchronous call throws immediately until that load finishes. If the load fails, the next synchronous call asks the worker to try again and returns at once. After the worker has loaded, a synchronous call waits up to 15 seconds instead of stopping after a fixed number of pauses.
