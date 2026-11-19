---
'expo-network': patch
---

[Android] Emit a network state event when the OS blocks or unblocks the app's network access (`onBlockedStatusChanged`). On Android 15 and newer, a backgrounded app now receives `isConnected: false` while the OS blocks it and `isConnected: true` when the app returns to the foreground.
