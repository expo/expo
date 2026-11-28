---
'expo-image-picker': patch
---

[Android] Recreate the crop output directory if Android evicted it while the crop UI was open, so confirming the crop resolves with an image instead of killing the process. ([#49802](https://github.com/expo/expo/issues/49802))
