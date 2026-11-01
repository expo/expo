---
'expo': patch
---

[iOS] Fix `StatusBar` `hidden` and `style` having no effect when `UIViewControllerBasedStatusBarAppearance` is `true`. The default root view controller now returns the status bar values that React Native stores in `RCTStatusBarAppearance`.
