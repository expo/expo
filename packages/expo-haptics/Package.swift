// swift-tools-version: 6.2
import PackageDescription

// The platforms below exist so this manifest is still valid on its own.
//
// `dependencies` is empty at both levels on purpose. ExpoModulesCore, React and Hermes
// resolve to app- or build-local paths that a checked-in manifest cannot name, so Expo's
// SwiftPM autolinking plugin and the prebuild pipeline inject them at generation time. A
// manifest that declares them for itself is rejected rather than merged.
let package = Package(
  name: "expo-haptics",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoHaptics", targets: ["ExpoHaptics"])
  ],
  dependencies: [],
  targets: [
    .target(
      name: "ExpoHaptics",
      dependencies: [],
      path: "ios"
    )
  ]
)
