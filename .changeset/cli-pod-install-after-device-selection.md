---
'@expo/cli': patch
---

`npx expo run:ios` now asks for the device before installing CocoaPods, and skips pod install when nothing is built (`--binary` or a build cache hit).
