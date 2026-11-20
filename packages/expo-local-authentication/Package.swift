// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-local-authentication`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-local-authentication",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoLocalAuthentication", targets: ["ExpoLocalAuthentication"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoLocalAuthentication",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoLocalAuthentication.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
