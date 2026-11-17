// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "expo-json-utils",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "EXJSONUtils", targets: ["EXJSONUtils"])
  ],
  targets: [
    .target(
      name: "EXJSONUtils",
      path: "ios/EXJSONUtils",
      publicHeadersPath: "include"
    )
  ]
)
