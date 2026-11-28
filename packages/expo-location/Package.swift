// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-location`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-location",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoLocation", targets: ["ExpoLocation", "ExpoLocationObjC"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoLocation",
      dependencies: [
        "ExpoLocationObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoLocation.podspec", "ExpoLocationObjC", "Tests"]
    ),
    .target(
      name: "ExpoLocationObjC",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoLocationObjC",
      publicHeadersPath: "include"
    )
  ],
  swiftLanguageModes: [.v5]
)
