// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "ExpoModulesCore",
  platforms: [.iOS(.v15), .macCatalyst(.v13)],
  products: [
    .library(name: "ExpoModulesCore", targets: ["ExpoModulesCore"]),
  ],
  dependencies: [],
  targets: [
    .target(
      name: "ExpoModulesCore",
      dependencies: [],
      path: "apple",
    )
  ]
)
