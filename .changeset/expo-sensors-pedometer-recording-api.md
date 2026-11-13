---
'expo-sensors': minor
---

Added pedometer pause and resume event helpers to `Pedometer`: `isEventTrackingAvailableAsync`, `startEventUpdatesAsync`, `stopEventUpdatesAsync`, and `watchEventUpdates`.

[Android] Implemented `getStepCountAsync` for `Pedometer` with the Recording API. Added `isRecordingAvailableAsync`, `subscribeRecordingAsync`, and `unsubscribeRecordingAsync` to `Pedometer`.
