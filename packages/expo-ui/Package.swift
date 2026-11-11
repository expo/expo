// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/@expo/ui`. Relative package paths
// such as `../../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-ui",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoUI", targets: ["ExpoUI"])
  ],
  dependencies: [
    .package(path: "../../ExpoModulesCoreHeaders"),
    .package(path: "../../ExpoModulesWorkletsHeaders")
  ],
  targets: [
    .target(
      name: "ExpoUI",
      dependencies: [
        "ExpoUIObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
        .product(name: "ExpoModulesWorkletsHeaders", package: "ExpoModulesWorkletsHeaders")
      ],
      path: "ios",
      exclude: ["ExpoUI.podspec", "ExpoUIObjC"]
    ),
    .target(
      name: "ExpoUIObjC",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoUIObjC",
      publicHeadersPath: "include"
    )
  ],
  swiftLanguageModes: [.v5]
)
