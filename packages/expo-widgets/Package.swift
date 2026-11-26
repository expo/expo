// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-widgets`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-widgets",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoWidgets", targets: ["ExpoWidgets"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
    .package(path: "../ExpoUIHeaders")
  ],
  targets: [
    .target(
      name: "ExpoWidgets",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
        .product(name: "ExpoUIHeaders", package: "ExpoUIHeaders")
      ],
      path: "ios",
      exclude: ["ExpoWidgets.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
