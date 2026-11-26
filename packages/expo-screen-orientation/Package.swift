// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-screen-orientation`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-screen-orientation",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoScreenOrientation", targets: ["ExpoScreenOrientation"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoScreenOrientation",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoScreenOrientation"
    )
  ],
  swiftLanguageModes: [.v5]
)
