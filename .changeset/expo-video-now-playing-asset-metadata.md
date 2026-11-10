---
'expo-video': patch
---

[iOS] Fix a crash when a video with embedded artwork plays with `showNowPlayingNotification` and no `metadata.artwork`. The Now Playing info now gets the title, the artist and the artwork as plain values instead of the asset's `AVMetadataItem`s.
