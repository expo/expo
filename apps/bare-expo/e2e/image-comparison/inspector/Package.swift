// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "ScreenInspectorDylib",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "ScreenInspectorDylib",
            type: .dynamic,
            targets: ["ScreenInspectorDylib"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "ScreenInspectorDylib",
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
