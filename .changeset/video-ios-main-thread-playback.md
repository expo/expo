---
"expo-video": patch
---

[iOS] Fix a KVO-related crash when `play`, `pause` or `replay` is called while AVKit observes the player, by applying these calls on the main thread.
