// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-application`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-application",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoApplication", targets: ["ExpoApplication", "ExpoApplicationObjC"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoApplication",
      dependencies: [
        "ExpoApplicationObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoApplication",
      sources: ["ApplicationExceptions.swift", "ApplicationModule.swift"],
      resources: [.copy("PrivacyInfo.xcprivacy")]
    ),
    .target(
      name: "ExpoApplicationObjC",
      path: "ios/ExpoApplicationObjC",
      publicHeadersPath: "include"
    )
  ],
  swiftLanguageModes: [.v5]
)
