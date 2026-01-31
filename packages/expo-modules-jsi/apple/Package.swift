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
      ],
      cxxSettings: [
        .headerSearchPath(".."),
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
        ])
      ],
      linkerSettings: [],
    ),

    // C++ target (internal)
    .target(
      name: "ExpoModulesJSI-Cxx",
      dependencies: [],
      cxxSettings: [
        .headerSearchPath(".."),
      ],
      linkerSettings: [
        .unsafeFlags([
          "-Wl", "-undefined", "dynamic_lookup"
        ]),
      ],
    ),

    .target(
      name: "jsi",
      dependencies: [],
      publicHeadersPath: "",
    ),

    .target(
      name: "hermes",
      dependencies: [
        "jsi"
      ],
      publicHeadersPath: "",
      cxxSettings: [
        .headerSearchPath(".."),
      ],
    ),

    // Tests
    .testTarget(
      name: "Tests",
      dependencies: ["ExpoModulesJSI"],
      swiftSettings: [
        .interoperabilityMode(.Cxx)
      ],
    ),
  ],
  swiftLanguageModes: [.v6],
  cxxLanguageStandard: .cxx20
)
