// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-background-task`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-background-task",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoBackgroundTask", targets: ["ExpoBackgroundTask", "ExpoBackgroundTaskObjC"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoBackgroundTask",
      dependencies: [
        "ExpoBackgroundTaskObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoBackgroundTask.podspec", "ExpoBackgroundTaskObjC", "Tests"]
    ),
    .target(
      name: "ExpoBackgroundTaskObjC",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoBackgroundTaskObjC",
      publicHeadersPath: "include"
    )
  ],
  swiftLanguageModes: [.v5]
)
