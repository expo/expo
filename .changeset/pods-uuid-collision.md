---
'expo-modules-autolinking': patch
---

[iOS] Fix `pod install` writing a damaged `Pods.xcodeproj` when objects created in a Podfile `post_install` hook or by Expo reuse UUIDs already in the project.
