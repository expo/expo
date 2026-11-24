---
"expo-splash-screen": patch
---

[Android] Let the app draw underneath the splash screen while it's shown, so the splash screen fades out over the app instead of over a blank screen. Previously, the app's first frame was held back until `hide()` was called, so apps with complex view hierarchies showed a blank screen during the fade.
