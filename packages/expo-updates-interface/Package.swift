// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-updates-interface`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-updates-interface",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "EXUpdatesInterface", targets: ["EXUpdatesInterface"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "EXUpdatesInterface",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["EXUpdatesInterface/noop-file.m"],
      sources: ["EXUpdatesInterface"]
    )
  ],
  swiftLanguageModes: [.v5]
)
