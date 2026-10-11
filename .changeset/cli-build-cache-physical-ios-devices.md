---
'@expo/cli': patch
'@expo/config': patch
---

Allow build cache providers to serve builds for physical iOS devices by setting `supportsIosPhysicalDevices: true`. `resolveBuildCache` receives the target device in `props.device`. When a provider is configured, `npx expo run:ios` waits for the cache lookup to miss before installing CocoaPods.
