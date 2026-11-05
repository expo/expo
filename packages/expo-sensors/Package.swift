// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-sensors`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-sensors",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoSensors", targets: ["ExpoSensors"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
  ],
  targets: [
    .target(
      name: "ExpoSensors",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
      ],
      path: "ios",
      exclude: ["ExpoSensors.podspec", "Tests"]
    ),
  ],
  swiftLanguageModes: [.v5]
)
