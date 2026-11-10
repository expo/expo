// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-file-system`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-file-system",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoFileSystem", targets: ["ExpoFileSystem"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
  ],
  targets: [
    .target(
      name: "ExpoFileSystemObjC",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
      ],
      path: "ios/ExpoFileSystemObjC",
      publicHeadersPath: "include"
    ),
    .target(
      name: "ExpoFileSystem",
      dependencies: [
        "ExpoFileSystemObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
      ],
      path: "ios",
      sources: ["ExpoFileSystem"],
      resources: [.copy("PrivacyInfo.xcprivacy")]
    ),
  ],
  swiftLanguageModes: [.v5]
)
