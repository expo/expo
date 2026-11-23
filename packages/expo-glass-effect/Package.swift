// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-glass-effect`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-glass-effect",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4")
  ],
  products: [
    .library(name: "ExpoGlassEffect", targets: ["ExpoGlassEffect"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoGlassEffect",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoGlassEffect.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
