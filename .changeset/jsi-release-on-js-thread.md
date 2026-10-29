---
'expo-modules-jsi': patch
---

Fix a deadlock on iOS when a JavaScript error clears the React Native scheduler queues while a task holds a promise or callback. When a promise or callback is dropped on the JavaScript thread, it now schedules the release of its state from another thread.
