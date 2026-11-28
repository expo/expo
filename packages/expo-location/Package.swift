// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-location`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-location",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoLocation", targets: ["ExpoLocation", "ExpoLocationObjC"]),
    .library(
      name: "ExpoLocationMotionActivity",
      targets: ["ExpoLocationMotionActivity", "ExpoLocationMotionActivityObjC"]
    )
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoLocation",
      dependencies: [
        "ExpoLocationObjC",
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: [
        "ExpoLocation.podspec",
        "ExpoLocationMotionActivity.podspec",
        "ExpoLocationObjC",
        "Tests",
        "motion-activity"
      ]
    ),
    .target(
      name: "ExpoLocationObjC",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios/ExpoLocationObjC",
      publicHeadersPath: "include"
    ),
    .target(
      name: "ExpoLocationMotionActivity",
      dependencies: ["ExpoLocation"],
      path: "ios/motion-activity/ExpoLocationMotionActivity"
    ),
    .target(
      name: "ExpoLocationMotionActivityObjC",
      dependencies: ["ExpoLocationMotionActivity"],
      path: "ios/motion-activity/ExpoLocationMotionActivityObjC",
      // Holds no public headers: the target only registers the provider from +load.
      publicHeadersPath: "include"
    )
  ],
  swiftLanguageModes: [.v5]
)
