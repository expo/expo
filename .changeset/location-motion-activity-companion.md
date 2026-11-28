---
'expo-location': patch
---

[iOS] Move the CoreMotion code to the `ExpoLocationMotionActivity` pod and SwiftPM product. When `motionUsagePermission` is `false`, the app does not include it, so `expo-location` does not link CoreMotion. Other packages can still link CoreMotion. `stopMotionActivityUpdatesAsync` and `hasStartedMotionActivityUpdatesAsync` work without the companion, so an app can stop a saved background task.
