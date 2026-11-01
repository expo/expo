---
"expo-modules-core": patch
"expo-task-manager": patch
---

[Android] Renamed `HeadlessAppLoader.isRunning` and `TaskServiceInterface.isStartedByHeadlessLoader` to `isRunningInHeadlessMode`, renamed `TaskService.getAppLoader` to `getHeadlessAppLoader`. Each of these only ever answered a question about headless mode, but their names read as general app or loader state, so callers and implementers treated the answer as more than it was.
