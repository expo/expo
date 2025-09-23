// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "IOSScreenshotDylib",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "IOSScreenshotDylib",
            type: .dynamic,
            targets: ["IOSScreenshotDylib"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "IOSScreenshotDylib",
            dependencies: [],
            path: "src",
            sources: [
                "ScreenshotServer.swift",
                "UICapture.swift"
            ],
            publicHeadersPath: "../include"
        ),
    ]
)
