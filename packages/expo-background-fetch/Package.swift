// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-background-fetch`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-background-fetch",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoBackgroundFetch", targets: ["ExpoBackgroundFetch"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoBackgroundFetch",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoBackgroundFetch.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
