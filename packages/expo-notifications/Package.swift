// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-notifications`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-notifications",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoNotifications", targets: ["ExpoNotifications"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoNotifications",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoNotifications",
      resources: [.copy("PrivacyInfo.xcprivacy")]
    )
  ],
  swiftLanguageModes: [.v5]
)
