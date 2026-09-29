---
"expo-ai": patch
---

Report the Android on-device model as unavailable on Android versions older than 8.0 instead of calling ML Kit, which requires API level 26.

See: [#49999](https://github.com/expo/expo/pull/49999)
