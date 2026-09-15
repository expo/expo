// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "expo",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
    .macOS("13.4"),
  ],
  products: [
    .library(name: "Expo", targets: ["Expo", "ExpoObjC", "ExpoLoader"])
  ],
  dependencies: [],
  targets: [
    .target(
      name: "Expo",
      dependencies: ["ExpoObjC"],
      path: "ios/Expo",
    ),
    .target(
      name: "ExpoObjC",
      dependencies: [],
      path: "ios/ExpoObjC",
      publicHeadersPath: "include",
    ),
    // The ObjC `+load` bootstrap that registers app-delegate subscribers before any
    // life-cycle event fires. It needs BOTH halves — `EXLegacyAppDelegateWrapper` from
    // ExpoObjC and `AppDelegatesLoaderDelegate` from Expo's generated Swift interface —
    // and Expo already depends on ExpoObjC, so it cannot live in either without a cycle.
    // A third target depending on both keeps the graph acyclic. (CocoaPods compiles all
    // of `ios/**` into one target, so this split is SwiftPM-only.)
    .target(
      name: "ExpoLoader",
      dependencies: ["Expo", "ExpoObjC"],
      path: "ios/ExpoLoader",
      publicHeadersPath: "include",
    ),
    .testTarget(
      name: "ExpoTests",
      dependencies: ["Expo"],
      path: "ios/Tests",
    ),
  ]
)
