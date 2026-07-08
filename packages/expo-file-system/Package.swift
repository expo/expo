// swift-tools-version: 6.2
import PackageDescription

// SwiftPM manifest for the ExpoFileSystem module. Mixed Swift/ObjC split into two
// targets. Dependencies (ExpoModulesCore, React where needed) are intentionally
// omitted — Expo's SwiftPM autolinking plugin injects them at generation time
// (they live at app/build-local paths a checked-in manifest can't reference).
// The recursive podspec glob still picks these sources up for CocoaPods.
let package = Package(
  name: "expo-file-system",
  platforms: [
    .iOS("16.0"),
    .tvOS("16.0"),
  ],
  products: [
    .library(name: "ExpoFileSystem", targets: ["ExpoFileSystem", "ExpoFileSystemObjC"])
  ],
  dependencies: [],
  targets: [
    .target(
      name: "ExpoFileSystem",
      dependencies: ["ExpoFileSystemObjC"],
      path: "ios/ExpoFileSystem"
    ),
    .target(
      name: "ExpoFileSystemObjC",
      dependencies: [],
      path: "ios/ExpoFileSystemObjC",
      publicHeadersPath: "include"
    ),
  ]
)
