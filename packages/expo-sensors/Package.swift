// swift-tools-version: 6.2
import PackageDescription

// Expo's SwiftPM plugin builds this manifest through a symlink to this directory at
// `<app>/ios/build/generated/autolinking/expo/direct/expo-sensors`. Relative package paths
// such as `../ExpoModulesCoreHeaders` resolve against that symlink, not against this directory.
let package = Package(
  name: "expo-sensors",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "ExpoSensors", targets: ["ExpoSensors"])
  ],
  dependencies: [
    .package(path: "../ExpoModulesCoreHeaders"),
  ],
  targets: [
    .target(
      name: "ExpoSensors",
      dependencies: [
        .product(name: "ExpoModulesCoreHeaders", package: "ExpoModulesCoreHeaders"),
      ],
      path: "ios",
      exclude: ["ExpoSensors.podspec", "Tests"],
      swiftSettings: [
        // SwiftPM rejects `$(BUILD_DIR)` in unsafeFlags; Xcode still expands `${BUILD_DIR}`.
        // Autolinking symlinks the macro plugin there before each build.
        .unsafeFlags([
          "-Xfrontend", "-load-plugin-executable",
          "-Xfrontend", "${BUILD_DIR}/ExpoModulesMacros#ExpoModulesMacros",
        ])
      ]
    ),
  ],
  swiftLanguageModes: [.v5]
)
