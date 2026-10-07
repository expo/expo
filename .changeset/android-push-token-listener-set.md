---
'expo-notifications': patch
---

[Android] Made the push token listener set thread-safe and removed the last-token replay, which ran before JavaScript could subscribe.
