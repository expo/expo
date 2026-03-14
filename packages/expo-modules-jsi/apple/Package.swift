// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
  name: "ExpoModulesJSI",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
    .macOS("12.0"),
  ],
  products: [
    .library(
      name: "ExpoModulesJSI",
      type: .dynamic,
      targets: ["ExpoModulesJSI"],
    ),
  ],
  dependencies: [],
  targets: [
    // Swift target (public)
    .target(
      name: "ExpoModulesJSI",
      dependencies: [
        "ExpoModulesJSI-Cxx",
        "hermes",
        "React",
        "ReactNativeDependencies",
      ],
      cxxSettings: [
        .headerSearchPath("../../Sources/hermes-engine/destroot/include"),
        .headerSearchPath("../../Sources/React/React.xcframework/Headers/React_Core"),
      ],
      swiftSettings: [
        .interoperabilityMode(.Cxx),

        // Enable some upcoming features that improve ergonomics and reduce executor hoppings
        // https://github.com/swiftlang/swift-evolution/blob/main/proposals/0461-async-function-isolation.md
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        // https://github.com/swiftlang/swift-evolution/blob/main/proposals/0470-isolated-conformances.md
        .enableUpcomingFeature("InferIsolatedConformances"),

        .unsafeFlags([
          "-enable-library-evolution",
          "-emit-module-interface",
          "-no-verify-emitted-module-interface",
          "-Xfrontend",
          "-clang-header-expose-decls=has-expose-attr",

          // Swift include paths
          "-Xcc",
          "-I../../Sources/hermes-engine/destroot/include",
          "-Xcc",
          "-I../../Sources/React/React.xcframework/Headers",
          "-Xcc",
          "-I../../Sources/ReactNativeDependencies/ReactNativeDependencies.xcframework/Headers",

          // API Notes
          "-Xcc",
          "-iapinotes-modules",
          "-Xcc",
          "../../APINotes",

          // VFS overlay
          "-Xcc",
          "-ivfsoverlay",
          "-Xcc",
          "../../Sources/React/React.xcframework/React-VFS.yaml"
        ]),
      ],
      linkerSettings: [],
    ),

    // C++ target (internal)
    .target(
      name: "ExpoModulesJSI-Cxx",
      dependencies: [
        "React"
      ],
      cxxSettings: [
        .headerSearchPath("../../Sources/hermes-engine/destroot/include"),
//        .headerSearchPath("../../Sources/React/React.xcframework/Headers/React_Core"),
        .unsafeFlags([
          "-ivfsoverlay",
          "../../Sources/React/React.xcframework/React-VFS.yaml"
        ])
      ],
    ),

    .binaryTarget(
      name: "hermes",
      path: "./Sources/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework"
    ),

    .binaryTarget(
      name: "React",
      path: "./Sources/React/React.xcframework"
    ),
    .binaryTarget(
      name: "ReactNativeDependencies",
      path: "./Sources/ReactNativeDependencies/ReactNativeDependencies.xcframework"
    ),

    // Tests
    .testTarget(
      name: "Tests",
      dependencies: ["ExpoModulesJSI"],
    ),
  ],
  swiftLanguageModes: [.v6],
  cxxLanguageStandard: .cxx20
)
