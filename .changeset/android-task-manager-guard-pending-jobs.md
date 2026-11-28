---
"expo-task-manager": patch
---

[android] Fix a crash in `TaskBroadcastReceiver` when a task's queued jobs are not being run. `scheduleJob` now catches a binder failure from `JobScheduler.getAllPendingJobs()` or `schedule()` and drops that batch instead of crashing the app, merges new data into the task's newest pending job once 20 jobs for that task are waiting instead of only at Android's job limit, and keeps at most 60 data entries in a merged job.
