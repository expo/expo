---
'expo-audio': patch
---

[Android] Return `USBAudio`, `BluetoothLE`, `LineIn`, `HDMI`, and `CarAudio` as `RecordingInput.type` for USB, Bluetooth LE, line-in, HDMI, and car audio inputs instead of `Unknown device type`. `getAvailableInputs()` now also lists USB inputs.
