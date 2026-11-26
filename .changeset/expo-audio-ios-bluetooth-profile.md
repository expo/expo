---
'expo-audio': minor
---

[iOS] Add the `bluetoothProfile` option to `AudioMode`. Set it to `'a2dp'` to keep Bluetooth headphones, such as AirPods, in high-quality stereo output while `allowsRecording` is `true`. The app then records from the built-in microphone. The default `'hfp'` keeps the current behavior.
