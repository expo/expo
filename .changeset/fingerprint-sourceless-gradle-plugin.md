---
'@expo/fingerprint': patch
---

Fix every Android Expo module being silently left out of the fingerprint when a module declares a gradle plugin resolved from Maven (without a `sourceDir`), such as `expo-widgets`. Native changes to Expo modules now change the Android fingerprint again, so OTA updates no longer reach binaries that are missing them.
