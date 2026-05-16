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
    .library(name: "Expo", targets: ["Expo", "ExpoObjC"])
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
    .testTarget(
      name: "ExpoTests",
      dependencies: ["Expo"],
      path: "ios/Tests",
    ),
  ]
)
