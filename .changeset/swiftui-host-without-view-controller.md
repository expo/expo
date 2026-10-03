---
'expo-modules-core': patch
---

[iOS] Fixed SwiftUI views (such as `@expo/ui`'s `Host`) rendering nothing when mounted outside any view controller, for example inside react-native-screens' `FullWindowOverlay`.
