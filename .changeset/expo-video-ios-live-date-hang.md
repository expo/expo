---
'expo-video': patch
---

[iOS] Fix app hangs caused by `timeUpdate` events and the `currentLiveTimestamp` and `currentOffsetFromLive` getters querying `AVPlayerItem.currentDate()` on the main thread for non-live videos. The live properties are now only computed for live streams and return `null` for on-demand videos, as documented.
