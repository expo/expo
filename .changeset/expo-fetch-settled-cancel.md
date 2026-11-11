---
'expo': patch
---

Fix the error-level `Invalid state` log on iOS, and the same warning on Android, when `expo/fetch` cancels a body that has already settled.
