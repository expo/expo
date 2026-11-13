// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-apple-authentication`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-apple-authentication",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoAppleAuthentication", targets: ["ExpoAppleAuthentication"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoAppleAuthentication",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoAppleAuthentication.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
