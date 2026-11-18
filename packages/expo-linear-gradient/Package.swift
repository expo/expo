// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-linear-gradient`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-linear-gradient",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoLinearGradient", targets: ["ExpoLinearGradient"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoLinearGradient",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoLinearGradient.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
