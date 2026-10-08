---
"expo-video": patch
---

[iOS] Fix a KVO-related crash when `play`, `pause`, `replay`, `playbackRate`, `volume` or `muted` is used while AVKit observes the player, by applying these changes on the main thread.
