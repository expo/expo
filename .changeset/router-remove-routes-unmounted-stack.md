---
'expo-router': patch
---

Fix the `REMOVE_ROUTES` "was not handled by any navigator" warning that appeared when a stack with `Stack.Protected` screens unmounted during startup.
