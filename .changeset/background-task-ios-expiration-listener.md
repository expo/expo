---
'expo-background-task': patch
---

[iOS] Fix `addExpirationListener` never being called. The task expiration handler posts its notification with an empty `userInfo`, but the module only forwarded it to JavaScript when `userInfo["url"]` was a `URL`, so every expiration was dropped.
