---
'expo-dev-menu-interface': patch
---

[iOS] Publish the prebuilt Release XCFramework as an empty stub with the same headers and modules as the Debug XCFramework, so a Release app that links the prebuilt framework contains no code from `expo-dev-menu-interface`.
