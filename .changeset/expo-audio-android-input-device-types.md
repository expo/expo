---
'expo-audio': patch
---

[Android] Return `USBAudio`, `BluetoothLE`, `LineIn`, `HDMI`, and `CarAudio` as `RecordingInput.type` for USB, Bluetooth LE, line-in, HDMI, and car audio inputs instead of `Unknown device type`. `getAvailableInputs()` now also lists USB and Bluetooth LE inputs, and `setInput()` routes recording to a Bluetooth LE headset.
