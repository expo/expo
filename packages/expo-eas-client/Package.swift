// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-eas-client`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-eas-client",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "EASClient", targets: ["EASClient"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "EASClient",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      sources: ["EASClient"],
      resources: [.copy("PrivacyInfo.xcprivacy")]
    )
  ],
  swiftLanguageModes: [.v5]
)
