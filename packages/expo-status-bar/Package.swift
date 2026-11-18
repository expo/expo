// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-status-bar`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-status-bar",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoStatusBar", targets: ["ExpoStatusBar"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoStatusBar",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoStatusBar.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
