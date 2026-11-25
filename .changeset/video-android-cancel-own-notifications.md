---
'expo-video': patch
---

Fix expo-video clearing notifications and Now Playing info owned by other modules: Android no longer cancels all of the app's notifications, and iOS no longer clears Now Playing when a player that never showed it is released.
