---
'expo-task-manager': patch
---

[Android] Fix an issue where scheduling a job would fail when `RECEIVE_BOOT_COMPLETED` is not in the app manifest, which led to crashes in the background. Add `RECEIVE_BOOT_COMPLETED` permission to the manifest, set job persistence based on whether this permission is in the manifest.
