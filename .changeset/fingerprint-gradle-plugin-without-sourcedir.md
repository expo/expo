---
'@expo/fingerprint': patch
---

Fix all Android Expo module sources being left out of the fingerprint when a module declares a gradle plugin that is resolved from Maven without a `sourceDir`, such as the one in `expo-widgets`. Native changes to Expo modules change the Android fingerprint again.
