---
'@expo/cli': patch
---

Fix short commands such as `expo config` waiting for a user lookup before they exit. When you are logged in, telemetry now uses the user ID from the stored session and does not send a request to the Expo API.
