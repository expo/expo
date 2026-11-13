---
'expo-audio': patch
---

[Android][iOS] Make `AudioPlayer.playbackRate` writable, as documented. Assigning to it used to throw because the native property only had a getter.
