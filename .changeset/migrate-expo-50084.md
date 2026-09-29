---
"expo": patch
---

[iOS] The SwiftPM autolinking plugin now contributes build-time script phases, so an Expo module that needs a build step under SwiftPM gets one — SwiftPM has no equivalent of CocoaPods' `script_phase`. First consumer: expo-constants' embedded `app.config`.

See: [#50084](https://github.com/expo/expo/pull/50084)
