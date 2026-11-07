---
'expo-app-metrics': patch
---

[Android] Stop listening to `expo-updates` state changes when the module is destroyed. Before, a React context destroyed without an Activity (for example, a headless JS task) left its listener registered, and the next `fetchUpdateAsync` call failed with `You attempted to access the app context before the module was created`.
