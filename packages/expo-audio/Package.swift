// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-audio`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-audio",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoAudio", targets: ["ExpoAudio", "ExpoAudioObjC"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoAudio",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
        "ExpoAudioObjC"
      ],
      path: "ios/ExpoAudio"
    ),
    .target(
      name: "ExpoAudioObjC",
      path: "ios/ExpoAudioObjC",
      publicHeadersPath: "include"
    )
  ],
  swiftLanguageModes: [.v5]
)
