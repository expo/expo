---
'expo-widgets': patch
---

[iOS] Give the widget extension group its own `Info.plist` file reference. Before, the group reused the reference of another extension's group, such as the `expo-sharing` share extension, and Xcode 27 refused to open the project.
