---
'expo-modules-core': patch
---

[iOS] Only run React delegate handlers until the first one returns a root view, so later handlers do not start their own React instances.
