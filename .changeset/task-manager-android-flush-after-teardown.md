---
'expo-task-manager': patch
---

[Android] Fix a crash (`You attempted to access the app context before the module was created`) when the React instance is destroyed within one second after JavaScript subscribes to task events.
