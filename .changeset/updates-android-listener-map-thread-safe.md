---
'expo-updates': patch
---

[Android] Fix a `ConcurrentModificationException` when a native module subscribes to or unsubscribes from updates state changes while the state machine notifies listeners.
