---
'expo-screen-capture': patch
---

[Android] Fix `preventScreenCaptureAsync` not blocking screenshots and screen recordings in other activities, such as the `expo-video` fullscreen player. The `FLAG_SECURE` flag is now applied to every activity of the app, including activities that open later.
