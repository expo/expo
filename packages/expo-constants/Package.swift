// swift-tools-version: 6.2
import PackageDescription

// SwiftPM manifest for the EXConstants module. Mixed Swift/ObjC, split into two
// targets (SwiftPM can't compile both in one). Dependencies (ExpoModulesCore, and
// React where needed) are intentionally omitted here — they live at app/build-local
// paths and are injected by Expo's SwiftPM autolinking plugin at generation time.
// The Expo.podspec-style recursive glob still picks these sources up for CocoaPods.
let package = Package(
  name: "expo-constants",
  platforms: [
    .iOS("16.0"),
    .tvOS("16.0"),
  ],
  products: [
    .library(name: "EXConstants", targets: ["EXConstants", "EXConstantsObjC"])
  ],
  dependencies: [],
  targets: [
    .target(
      name: "EXConstants",
      dependencies: [],
      path: "ios/EXConstants"
    ),
    .target(
      name: "EXConstantsObjC",
      dependencies: [],
      path: "ios/EXConstantsObjC",
      publicHeadersPath: "include"
    ),
  ]
)
