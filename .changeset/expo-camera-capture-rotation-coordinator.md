---
'expo-camera': patch
---

[iOS] Fixed photos and videos being saved turned 90° from the preview on the iPhone Duo's inner display. Capture now takes its angle from the same `AVCaptureDevice.RotationCoordinator` that rotates the preview on iOS 17+, and the crop to the preview's aspect follows that angle.
