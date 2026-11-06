---
'expo-video': patch
---

[iOS] Fix `timeUpdate` events blocking the main thread for seconds on on-demand videos. The live-stream fields are now read once per update and only for live streams.
