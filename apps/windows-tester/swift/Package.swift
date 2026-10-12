// swift-tools-version: 6.2

import Foundation
import PackageDescription

// The `ExpoModulesMacros` compiler plugin, built from the `expo-modules-macros` repository. Expo
// loads the same executable on Apple platforms. `#ExpoModulesMacros` names the module that the
// macro declarations in `ExpoModulesCore` refer to.
let macrosPluginFlags =
  ProcessInfo.processInfo.environment["EXPO_MODULES_MACROS_PLUGIN"].map({
    ["-load-plugin-executable", "\($0)#ExpoModulesMacros"]
  }) ?? []

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
    // A stand-in for `expo-modules-core` with what the macro expansions refer to. It loads the
    // plugin too, so the compiler can check the macro declarations.
    .target(
      name: "ExpoModulesCore",
      dependencies: [
        .product(name: "ExpoModulesJSI", package: "apple")
      ],
      swiftSettings: [
        .unsafeFlags(macrosPluginFlags)
      ]
    ),
    .target(
      name: "ExpoWindowsTester",
      dependencies: [
        "ExpoModulesCore"
      ],
      swiftSettings: [
        .unsafeFlags(macrosPluginFlags)
      ]
    ),
  ],
  swiftLanguageModes: [.v6]
)
