---
'expo': patch
---

[iOS] Write `ios/ExpoSPM/ExpoWidgetsExtension.xcconfig` during the Swift Package Manager sync when `expo-widgets` is autolinked. The file links only the frameworks that ExpoWidgets depends on.
