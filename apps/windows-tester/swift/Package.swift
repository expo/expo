// swift-tools-version: 6.2

import PackageDescription

// The Swift side of the Windows tester app: a DLL that installs a few functions written with
// `ExpoModulesJSI` into the runtime of a react-native-windows app. The app's MSBuild project builds
// this package and calls the C functions that `ExpoWindowsTester.swift` exports.
let package = Package(
  name: "ExpoWindowsTester",
  // Matches `ExpoModulesJSI`, so the package also type-checks on macOS.
  platforms: [.macOS("13.4")],
  products: [
    .library(name: "ExpoWindowsTester", type: .dynamic, targets: ["ExpoWindowsTester"])
  ],
  dependencies: [
    .package(path: "../../../packages/expo-modules-jsi/apple")
  ],
  targets: [
    .target(
      name: "ExpoWindowsTester",
      dependencies: [
        .product(name: "ExpoModulesJSI", package: "apple")
      ]
    )
  ],
  swiftLanguageModes: [.v6]
)
