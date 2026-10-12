---
'expo-video': patch
---

[iOS] Don't change the audio session category if compatible with the current intention - for example changing from `playAndRecord` to `playback`. Improves inter-package compatibility.
