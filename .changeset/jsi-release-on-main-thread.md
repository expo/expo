---
'expo-modules-jsi': patch
---

Fix a deadlock on iOS when a JavaScript error clears the React Native scheduler queues on the main thread, during an event that a native view dispatches with `experimental_flushSync`. A promise or callback that is dropped on the main thread now schedules the release of its state from another thread, as it already did on the JavaScript thread.
