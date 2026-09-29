---
"expo-modules-autolinking": patch
---

[iOS] Use collision-safe UUIDs for objects created in the Podfile's `post_install` too, such as React Native's `spm_dependency` Swift packages. Before, they could reuse UUIDs already in `Pods.xcodeproj` and leave a project Xcode cannot open.

See: [#50794](https://github.com/expo/expo/issues/50794)
