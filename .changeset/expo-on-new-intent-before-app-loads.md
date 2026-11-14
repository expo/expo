---
"expo": patch
---

[Android] Fix intents delivered through `onNewIntent` being dropped while the app is still loading, for example while `expo-updates` delays it. They're now delivered once the app has loaded. This fixes notification taps losing their payload (`getLastNotificationResponseAsync()` returning `null`) when they relaunch an app whose process was killed but whose task was still in recents.
