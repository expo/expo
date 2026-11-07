// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-system-ui`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-system-ui",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoSystemUI", targets: ["ExpoSystemUI"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoSystemUI",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      sources: ["ExpoSystemUI"],
      resources: [.copy("PrivacyInfo.xcprivacy")]
    )
  ],
  swiftLanguageModes: [.v5]
)
