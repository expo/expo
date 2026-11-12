---
'expo-widgets': patch
---

[iOS] Support Swift Package Manager in the widget extension. When `experiments.swiftPackageManager` is enabled, the config plugin links the extension to the expo-widgets Swift package and adds build phases that build the widgets bundle and the ExpoModulesJSI framework for the extension.
