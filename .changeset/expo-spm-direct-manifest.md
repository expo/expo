---
"expo": patch
---

[iOS] The SwiftPM plugin links an Expo module's precompiled XCFramework whenever one exists, unless the app lists the module in its `buildFromSource` autolinking option, which the plugin now honours as CocoaPods does. A module built from source whose checked-in Package.swift depends on the `ExpoModulesCoreHeaders` product is built from that manifest as it stands.
