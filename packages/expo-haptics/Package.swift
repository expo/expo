// swift-tools-version: 6.2
import PackageDescription
import Foundation

struct PackageJSON: Decodable {
  let name: String
}

let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let packageJsonData = try Data(contentsOf: packageDir.appendingPathComponent("package.json"))
let packageJson = try JSONDecoder().decode(PackageJSON.self, from: packageJsonData)

let package = Package(
  name: packageJson.name,
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
    .macOS("13.4"),
  ],
  products: [
    .library(
      name: "ExpoHaptics",
      targets: ["ExpoHaptics"]
    ),
  ],
  dependencies: [
    .package(path: "../expo-modules-core"),
  ],
  targets: [
    .target(
      name: "ExpoHaptics",
      dependencies: [
        .product(name: "ExpoModulesCore", package: "expo-modules-core"),
      ],
      path: "ios",
    )
  ]
)
