---
"expo-camera": patch
---

[Web] Fire `onCameraReady` only once the video element has enough data to take a picture, instead of as soon as the camera stream is obtained. Calling `takePictureAsync` right after `onCameraReady` no longer throws `ERR_CAMERA_NOT_READY`.
