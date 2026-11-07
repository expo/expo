// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-symbols`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-symbols",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoSymbols", targets: ["ExpoSymbols"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoSymbols",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoSymbols.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
