// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-hinge`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-hinge",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoHinge", targets: ["ExpoHinge"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
    .package(path: "../ExpoModulesWorkletsHeaders")
  ],
  targets: [
    .target(
      name: "ExpoHinge",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
        .product(name: "ExpoModulesWorkletsHeaders", package: "ExpoModulesWorkletsHeaders")
      ],
      path: "ios",
      exclude: ["ExpoHinge.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
