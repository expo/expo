// swift-tools-version: 6.0
import PackageDescription

// Swift Package Manager support for React Native's SwiftPM autolinking
// (react-native >= 0.87). CocoaPods users are unaffected; see the podspec.
// The two React Native packages are resolved by the autolinker relative to
// build/generated/autolinking/libs/ReactNativeViewShot in the app.
let package = Package(
    name: "ReactNativeViewShot",
    // Must not exceed RN's generated Autolinked aggregate (iOS 15.0).
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "ReactNativeViewShot", targets: ["ReactNativeViewShot"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "ReactNativeViewShot",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            path: "ios",
            exclude: ["RNViewShot.xcodeproj"],
            sources: ["RNViewShot.h", "RNViewShot.mm"],
            resources: [.copy("PrivacyInfo.xcprivacy")],
            publicHeadersPath: ".",
            cSettings: [
                // SwiftPM autolinking is New Architecture only; CocoaPods gets
                // this from install_modules_dependencies.
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
            ],
            cxxSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
