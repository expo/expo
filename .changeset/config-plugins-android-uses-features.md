---
'@expo/config-types': patch
'@expo/config-plugins': patch
'@expo/prebuild-config': patch
---

[Android] Add `android.usesFeatures` to the app config. Prebuild writes each entry as a `<uses-feature>` element in `AndroidManifest.xml`. Set `required` to `false` to keep Google Play from hiding the app on devices without an implied feature, such as `android.hardware.wifi` or `android.hardware.screen.portrait`.
