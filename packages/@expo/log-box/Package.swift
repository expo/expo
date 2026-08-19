// swift-tools-version: 6.2
import PackageDescription

// SwiftPM manifest for the ExpoLogBox module. Split into a Swift target and a
// Clang target; the ObjC target (an RCTRedBox +load swizzle) depends on the Swift
// target for ExpoLogBoxScreenProvider (a one-directional ObjC→Swift edge — no cycle,
// since the Swift sources don't reference the ObjC). ExpoModulesCore/React deps are
// injected by Expo's SwiftPM autolinking plugin at generation time.
let package = Package(
  name: "expo-log-box",
  platforms: [
    .iOS("16.0"),
    .tvOS("16.0"),
  ],
  products: [
    .library(name: "ExpoLogBox", targets: ["ExpoLogBox", "ExpoLogBoxObjC"])
  ],
  dependencies: [],
  targets: [
    .target(
      name: "ExpoLogBox",
      dependencies: [],
      path: "ios/ExpoLogBox"
    ),
    .target(
      name: "ExpoLogBoxObjC",
      dependencies: ["ExpoLogBox"],
      path: "ios/ExpoLogBoxObjC",
      // No public headers (an RCTRedBox +load swizzle) — point at an empty dir so
      // SwiftPM doesn't reject the default "include" path that doesn't exist.
      publicHeadersPath: "include"
    ),
  ]
)
