// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-tracking-transparency`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-tracking-transparency",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoTrackingTransparency", targets: ["ExpoTrackingTransparency"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoTrackingTransparency",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoTrackingTransparency.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
