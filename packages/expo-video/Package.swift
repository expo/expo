// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-video`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-video",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoVideo", targets: ["ExpoVideo"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoVideo",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoVideo"
    )
  ],
  swiftLanguageModes: [.v5]
)
