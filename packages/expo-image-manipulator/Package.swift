// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-image-manipulator`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-image-manipulator",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoImageManipulator", targets: ["ExpoImageManipulator"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
    .package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),
    .package(url: "https://github.com/SDWebImage/SDWebImageWebPCoder.git", exact: "0.15.0"),
    .package(url: "https://github.com/SDWebImage/libwebp-Xcode.git", exact: "1.6.0"),
  ],
  targets: [
    .target(
      name: "ExpoImageManipulator",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
        .product(name: "SDWebImage", package: "SDWebImage"),
        .product(name: "SDWebImageWebPCoder", package: "SDWebImageWebPCoder"),
        .product(name: "libwebp", package: "libwebp-Xcode"),
      ],
      path: "ios/ExpoImageManipulator"
    )
  ],
  swiftLanguageModes: [.v5]
)
