---
'expo-localization': patch
---

Fix the Android `supportedLocales` config plugin failing prebuild with `Failed to match "/versionName "[\d.]+"/"` when the app version has a prerelease suffix, such as `1.0.0-beta.1`.
