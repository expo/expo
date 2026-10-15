---
'@expo/ui': patch
---

Stop shipping a precompiled iOS framework. `@expo/ui` now builds from source on iOS, so components that need a newer iOS SDK than the one used to precompile, such as `ArrangementView` and `onHingeChange` on iOS 27, work without `buildFromSource`.
