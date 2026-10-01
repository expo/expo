---
"expo-splash-screen": patch
---

[Android] Fix the splash screen staying visible over the app on Android 12 and 13 when the activity stops before the splash screen exits, for example when the app starts while the device is locked. This removes the workaround added in #44584.
