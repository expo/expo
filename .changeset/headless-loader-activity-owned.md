---
"expo-modules-core": patch
---

[Android] Fix `RNHeadlessAppLoader.isRunning` reporting an app as headless after an Activity took over its React host, for example when a background task event arrived during a cold start. `expo-task-manager` then skipped forwarding `onHostResume`, `onHostPause` and `onHostDestroy` to task consumers such as `expo-location`'s, which kept reporting locations as if the app were in the foreground or background.
