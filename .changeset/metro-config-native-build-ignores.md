---
'@expo/metro-config': patch
---

Remove the `ios/Pods`, `android/app/build` and `android/.gradle` pattern from `resolver.blockList`. Only `@expo/metro-file-map` matched it, and Expo CLI now excludes these directories itself.
