// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-mesh-gradient`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-mesh-gradient",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoMeshGradient", targets: ["ExpoMeshGradient"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoMeshGradient",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoMeshGradient.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
