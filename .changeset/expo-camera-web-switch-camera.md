---
'expo-camera': patch
---

[Web] Fix toggling `facing` not switching cameras on devices whose camera drivers don't report `facingMode`, such as Microsoft Surface devices in Chrome and Edge. When the browser returns the camera that is already active, `CameraView` now switches to another camera by `deviceId`, preferring one whose label matches the requested `facing`. On desktops with multiple cameras, toggling `facing` now cycles through them instead of doing nothing. The duplicate stream that was previously left open in that case is now stopped, and the preview of a camera labeled as a rear camera is no longer mirrored.
