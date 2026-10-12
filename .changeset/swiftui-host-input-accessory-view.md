---
'expo-modules-core': patch
---

[iOS] Fix a `UIViewControllerHierarchyInconsistency` crash when a SwiftUI view (such as `@expo/ui`'s `Host`) is rendered inside a text input's accessory view, for example React Native's `InputAccessoryView` or react-native-keyboard-controller's `KeyboardExtender`.
