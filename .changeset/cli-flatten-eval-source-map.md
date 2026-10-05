---
'@expo/cli': patch
---

Fix stack traces for errors thrown in API routes and server data loaders during `expo start`, which pointed into the server bundle or at the wrong source file.
