---
'expo': patch
---

[iOS] Fixed the command socket dialing port 8081 instead of the scheme default port when the dev server URL has no port, which stopped Metro reload (`r`) from reaching the app.
