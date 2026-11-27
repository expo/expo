// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-localization`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-localization",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoLocalization", targets: ["ExpoLocalization"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoLocalization",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoLocalization.podspec", "Tests"],
      sources: ["LocalizationModule.swift", "LocalizationRecords.swift"],
      resources: [.copy("PrivacyInfo.xcprivacy")]
    )
  ],
  swiftLanguageModes: [.v5]
)
