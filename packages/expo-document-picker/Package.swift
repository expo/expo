// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-document-picker`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-document-picker",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoDocumentPicker", targets: ["ExpoDocumentPicker"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoDocumentPicker",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoDocumentPicker.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
