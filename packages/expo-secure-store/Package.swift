// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-secure-store`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-secure-store",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoSecureStore", targets: ["ExpoSecureStore"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoSecureStore",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoSecureStore.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
