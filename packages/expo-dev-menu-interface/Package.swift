// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "expo-dev-menu-interface",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "EXDevMenuInterface", targets: ["EXDevMenuInterface"])
  ],
  targets: [
    .target(
      name: "EXDevMenuInterface",
      path: "ios",
      exclude: ["expo-dev-menu-interface.podspec"]
    )
  ],
  swiftLanguageModes: [.v5]
)
