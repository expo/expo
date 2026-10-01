---
"expo": patch
---

[macOS] Fix the `AppController.sharedInstace was called before the module was initialized` assertion at launch with `react-native-macos` 0.83, where `EXReactRootViewFactory` did not override the `viewWithModuleName:initialProperties:launchOptions:devMenuConfiguration:` method that `RCTReactNativeFactory` calls.
