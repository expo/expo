---
'expo-camera': patch
---

[Android] Stop observing the previous camera's state when the camera is bound again, so `onCameraReady` fires once per bind and a closed `CameraView` is no longer kept alive.
