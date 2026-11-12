// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "unimodules-app-loader",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
  ],
  products: [
    .library(name: "UMAppLoader", targets: ["UMAppLoader"])
  ],
  dependencies: [],
  targets: [
    .target(
      name: "UMAppLoader",
      dependencies: [],
      path: "ios/UMAppLoader",
      publicHeadersPath: "include"
    )
  ]
)
