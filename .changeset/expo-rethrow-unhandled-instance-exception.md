---
'expo': patch
---

[Android] Fix an app that stays on a blank screen after a JS or native crash in a release build with the New Architecture, when a package such as `expo-updates` registers a React host handler. The React host now rethrows an exception that no handler takes, so the process ends and crash reporters record it.
