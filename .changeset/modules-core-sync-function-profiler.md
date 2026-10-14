---
"expo-modules-core": patch
---

[iOS] Add `SyncFunctionCallProfiler`: synchronous `Function` and `Property` accessor calls are timed and the ones above a configurable threshold are reported to a process-wide observer as `SlowSyncCall` (`Module.function`, kind, start time, duration, thread). A sync function that waits — on a lock, another thread, an XPC service or disk — blocks the JavaScript thread without anything showing on the main thread; this lets performance tooling such as `expo-app-metrics` name the module responsible. Without an observer the cost per call is a single guarded load.
