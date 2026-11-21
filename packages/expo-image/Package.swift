// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-image`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-image",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoImage", targets: ["ExpoImage"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
    .package(url: "https://github.com/SDWebImage/SDWebImage.git", exact: "5.21.6"),
    .package(url: "https://github.com/SDWebImage/SDWebImageAVIFCoder.git", exact: "0.12.0"),
    .package(url: "https://github.com/SDWebImage/SDWebImageSVGCoder.git", exact: "1.8.0"),
    .package(url: "https://github.com/SDWebImage/SDWebImageWebPCoder.git", exact: "0.15.0"),
    .package(url: "https://github.com/SDWebImage/libavif-Xcode.git", exact: "1.0.0"),
    .package(url: "https://github.com/SDWebImage/libdav1d-Xcode.git", exact: "1.2.0"),
  ],
  targets: [
    .target(
      name: "ExpoImage",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
        .product(name: "SDWebImage", package: "SDWebImage"),
        .product(name: "SDWebImageAVIFCoder", package: "SDWebImageAVIFCoder"),
        .product(name: "SDWebImageSVGCoder", package: "SDWebImageSVGCoder"),
        .product(name: "SDWebImageWebPCoder", package: "SDWebImageWebPCoder"),
        .product(name: "libavif", package: "libavif-Xcode"),
        .product(name: "libdav1d", package: "libdav1d-Xcode"),
      ],
      path: "ios",
      exclude: ["ExpoImage.podspec", "Tests"]
    )
  ],
  swiftLanguageModes: [.v5]
)
