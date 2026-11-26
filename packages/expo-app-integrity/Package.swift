// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/@expo/app-integrity`. Relative package paths
// such as `../../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-app-integrity",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoAppIntegrity", targets: ["ExpoAppIntegrity"])
  ],
  dependencies: [
    .package(path: "../../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoAppIntegrity",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoAppIntegrity.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
