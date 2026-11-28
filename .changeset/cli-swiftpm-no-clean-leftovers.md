---
'@expo/cli': patch
---

Remove the `[Expo] Configure project` build phase and the `Pods/` `ExpoModulesProvider.swift` reference from the Xcode project when `expo prebuild --no-clean` sets up Swift Package Manager.
