// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "expo-structured-headers",
  platforms: [
    .iOS("16.4")
  ],
  products: [
    .library(name: "EXStructuredHeaders", targets: ["EXStructuredHeaders"])
  ],
  targets: [
    .target(
      name: "EXStructuredHeaders",
      path: "ios/EXStructuredHeaders",
      publicHeadersPath: "include"
    )
  ]
)
