---
'expo-camera': patch
---

[Android] Fixed barcode scanning stopping after the camera delivers a frame without an image. Also fixed a leak of the ML Kit barcode scanner each time the camera is recreated or unmounted.
