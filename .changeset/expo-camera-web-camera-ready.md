---
'expo-camera': patch
---

[Web] Fire `onCameraReady` only once the video has a frame that can be captured, instead of as soon as the camera stream is obtained, so calling `takePictureAsync` from `onCameraReady` no longer throws `ERR_CAMERA_NOT_READY`. `takePictureAsync` now only requires a decoded frame instead of `HAVE_ENOUGH_DATA`, which live streams may never reach in Safari. `onCameraReady` is no longer called when the camera fails to start; use `onMountError` instead.
