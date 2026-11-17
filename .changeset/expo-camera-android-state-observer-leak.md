---
'expo-camera': patch
---

[Android] Fixed `onCameraReady` firing more than once after the camera is rebound, and the camera view staying in memory after it unmounts, until the activity is destroyed.
