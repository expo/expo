// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "expo-modules-core",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
    .macOS("13.4"),
  ],
  products: [
    .library(
      name: "ExpoModulesCore",
      targets: ["ExpoModulesCore", "ExpoModulesCoreObjC", "ExpoModulesCoreCommon"]
    ),
    .library(
      name: "ExpoModulesWorklets",
      targets: ["ExpoModulesWorklets", "ExpoModulesWorkletsObjC"]
    ),
    .library(
      name: "ExpoModulesWorkletsAdapter",
      targets: ["ExpoModulesWorkletsAdapter"]
    ),
  ],
  dependencies: [],
  targets: [
    .target(
      name: "ExpoModulesCore",
      dependencies: ["ExpoModulesCoreObjC"],
      path: "ios/ExpoModulesCore",
    ),
    .target(
      name: "ExpoModulesCoreObjC",
      dependencies: ["ExpoModulesCoreCommon"],
      path: "ios/ExpoModulesCoreObjC",
      publicHeadersPath: "include",
    ),
    .target(
      name: "ExpoModulesCoreCommon",
      path: "common/cpp",
      publicHeadersPath: ".",
    ),
    .target(
      name: "ExpoModulesWorklets",
      dependencies: ["ExpoModulesWorkletsObjC", "ExpoModulesCore"],
      path: "ios/ExpoModulesWorklets",
    ),
    .target(
      name: "ExpoModulesWorkletsObjC",
      dependencies: ["ExpoModulesCoreObjC"],
      path: "ios/ExpoModulesWorkletsObjC",
      publicHeadersPath: "include",
    ),
    .target(
      name: "ExpoModulesWorkletsAdapter",
      dependencies: ["ExpoModulesWorkletsObjC"],
      path: "ios/ExpoModulesWorkletsAdapter",
      publicHeadersPath: "include",
    ),
    .testTarget(
      name: "ExpoModulesCoreTests",
      dependencies: ["ExpoModulesCore"],
      path: "ios/Tests",
      exclude: ["EXAppDefinesTest.m"],
    ),
  ]
)
