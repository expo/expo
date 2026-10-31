---
'expo-camera': patch
---

[iOS] Fix the torch staying off after the camera session restarts. Setting `active` to `false` and back (for example when the screen loses and regains focus) or a session interruption turned the torch off, while `enableTorch` was still `true` and was only re-applied when the prop changed. The torch is now re-applied whenever the session starts running again or an interruption ends.
