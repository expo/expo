// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/@expo/dom-webview`. Relative package paths
// such as `../../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-dom-webview",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoDomWebView", targets: ["ExpoDomWebView"])
  ],
  dependencies: [
    .package(path: "../../ExpoModulesCoreHeaders")
  ],
  targets: [
    .target(
      name: "ExpoDomWebView",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders")
      ],
      path: "ios",
      exclude: ["ExpoDomWebView.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
