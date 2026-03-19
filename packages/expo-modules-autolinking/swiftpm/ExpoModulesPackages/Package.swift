// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "ExpoModulesPackages",
  platforms: [.iOS(.v15), .macCatalyst(.v13)],
  products: [
    .library(name: "ExpoModulesPackages", targets: ["ExpoModulesPackages"])
  ],
  dependencies: [
    .package(name: "ExpoModulesCore", path: "../../../expo-modules-core")
  ],
  targets: [
    .target(
      name: "ExpoModulesPackages",
      dependencies: ["ExpoModulesCore"],
    )
  ]
)
