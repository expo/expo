// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-video-thumbnails`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-video-thumbnails",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoVideoThumbnails", targets: ["ExpoVideoThumbnails"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoVideoThumbnails",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoVideoThumbnails.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
