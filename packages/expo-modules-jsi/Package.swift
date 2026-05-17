// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription
import Foundation

// MARK: - Mode selection
//
// The manifest exposes two shapes:
//
// • **Consumer mode** (default): a single `.binaryTarget` pointing at the
//   already-built `apple/Products/ExpoModulesJSI.xcframework`. Downstream
//   SwiftPM packages link the binary and get no C++ interop spilling into
//   their compiles.
//
// • **Builder mode** (opt-in via `EXPO_MODULES_JSI_BUILD_FROM_SOURCE=1`):
//   the original source-built shape with C++ interop, JSI/Folly/React header
//   search paths, and `-undefined dynamic_lookup`. Used by
//   `apple/scripts/build-xcframework.sh` and `apple/scripts/test.sh` — the
//   only callers that need to actually compile JSI.
//
// Keeping both in one committed manifest avoids file-swap rituals at build time.

let buildFromSource = ProcessInfo.processInfo.environment["EXPO_MODULES_JSI_BUILD_FROM_SOURCE"] == "1"

let package: Package = buildFromSource ? builderPackage() : consumerPackage()

// MARK: - Consumer mode

func consumerPackage() -> Package {
  let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
  let xcframeworkPath = "apple/Products/ExpoModulesJSI.xcframework"

  precondition(
    FileManager.default.fileExists(atPath: "\(packageDir)/\(xcframeworkPath)"),
    """
    ExpoModulesJSI.xcframework is missing at \(xcframeworkPath). \
    Build it with `pnpm build` from packages/expo-modules-jsi, or run `pod install` \
    in the host app — its script phase rebuilds the xcframework. \
    Set EXPO_MODULES_JSI_BUILD_FROM_SOURCE=1 to use the source-build mode instead.
    """
  )

  return Package(
    name: "expo-modules-jsi",
    platforms: [
      .iOS("16.4"),
      .tvOS("16.4"),
      .macOS("13.4"),
    ],
    products: [
      .library(name: "ExpoModulesJSI", targets: ["ExpoModulesJSI"]),
    ],
    targets: [
      .binaryTarget(name: "ExpoModulesJSI", path: xcframeworkPath),
    ]
  )
}

// MARK: - Builder mode

func builderPackage() -> Package {
  let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
  let appleDir = "\(packageDir)/apple"
  let podsRoot = resolvePodsRoot(packageDir: packageDir)

  // Header roots for ExpoModulesJSI and ExpoModulesJSI-Cxx. The
  // Pods/Headers/Public paths cover no-frameworks and prebuilt-RN; the trailing
  // entries fall back to canonical sources for the static + source-built RN
  // combo, where each React-X / third-party-deps pod compiles as a static
  // framework and its headers don't get mirrored to Pods/Headers/Public. Clang
  // ignores missing `-I` paths, so they're no-ops elsewhere. `RN_ROOT` is
  // forwarded from build-xcframework.sh (Node-resolved for hoisted monorepos).
  // `REACT_NATIVE_PATH` is exported by Xcode for hosts that build RN from a
  // non-npm location, e.g. Expo Go.
  let publicHeaders = "\(podsRoot)/Headers/Public"
  let reactNative = ProcessInfo.processInfo.environment["RN_ROOT"]
    ?? ProcessInfo.processInfo.environment["REACT_NATIVE_PATH"]
    ?? "\(podsRoot)/../../node_modules/react-native"
  let headerSearchPaths = [
    publicHeaders,
    "\(publicHeaders)/React-jsi",
    "\(publicHeaders)/hermes-engine",
    "\(publicHeaders)/React-runtimescheduler",
    "\(publicHeaders)/React-rendererconsistency",
    "\(publicHeaders)/React-performancetimeline",
    "\(publicHeaders)/React-timing",
    "\(publicHeaders)/React-debug",
    "\(publicHeaders)/React-callinvoker",
    "\(publicHeaders)/React-runtimeexecutor",
    "\(publicHeaders)/RCT-Folly",
    "\(publicHeaders)/ReactNativeDependencies",
    "\(publicHeaders)/glog",
    "\(publicHeaders)/DoubleConversion",
    "\(publicHeaders)/fmt",
    "\(publicHeaders)/fast_float",
    "\(reactNative)/ReactCommon",
    "\(reactNative)/ReactCommon/jsi",
    "\(reactNative)/ReactCommon/runtimeexecutor",
    "\(reactNative)/ReactCommon/callinvoker",
    "\(podsRoot)/RCT-Folly",
    "\(podsRoot)/fmt/include",
    "\(podsRoot)/glog/src",
    "\(podsRoot)/DoubleConversion",
  ]

  // Path to the generated module map for the `jsi` Clang module. The
  // `apple/scripts/generate-modulemap.sh` script writes this file at build time so
  // the absolute header path can be resolved against the runtime PODS_ROOT.
  // Lives outside `.build/` so SwiftPM state can be wiped without losing this
  // file.
  let generatedModuleMap = "\(appleDir)/.generated/module.modulemap"
  let apiNotesPath = "\(appleDir)/APINotes"

  let cxxIncludeFlags = headerSearchPaths.map({ "-I\($0)" })
  let swiftIncludeFlags = headerSearchPaths.flatMap({ ["-Xcc", "-I\($0)"] })

  let testFrameworks = resolveTestFrameworks(appleDir: appleDir)

  return Package(
    name: "expo-modules-jsi",
    platforms: [
      .iOS("16.4"),
      .tvOS("16.4"),
      .macOS("13.4"),
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
        path: "apple/Sources/ExpoModulesJSI",
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

            // Module map for the `jsi` Clang module, generated by build-xcframework.sh
            // before xcodebuild runs.
            "-Xcc", "-fmodule-map-file=\(generatedModuleMap)",

            // API Notes
            "-Xcc", "-iapinotes-modules",
            "-Xcc", apiNotesPath,
          ]),

          .unsafeFlags(swiftIncludeFlags),
        ],
        linkerSettings: [
          // React, ReactCommon, hermes, and JSI symbols are provided by the host
          // app at final link time. Defer their resolution so the xcframework
          // builds without those static libs being available here.
          .unsafeFlags([
            "-Xlinker", "-undefined", "-Xlinker", "dynamic_lookup",
          ]),
        ],
      ),

      // C++ target (internal)
      .target(
        name: "ExpoModulesJSI-Cxx",
        dependencies: [],
        path: "apple/Sources/ExpoModulesJSI-Cxx",
        cxxSettings: [
          .unsafeFlags(cxxIncludeFlags),
        ],
      ),

      // Tests
      .testTarget(
        name: "Tests",
        dependencies: testFrameworks.dependencies,
        path: "apple/Tests",
      ),
    ] + testFrameworks.binaryTargets,
    swiftLanguageModes: [.v6],
    cxxLanguageStandard: .cxx20
  )
}

// MARK: - Helpers (shared by builder mode)

// Resolve PODS_ROOT from the environment. CocoaPods build phases always set
// it; otherwise fall back to bare-expo's Pods so headers resolve for
// indexing and direct script invocations. The manifest sandbox blocks
// `fileExists` outside the package — fail loudly later if Pods aren't there.
func resolvePodsRoot(packageDir: String) -> String {
  let env = ProcessInfo.processInfo.environment
  if let explicit = env["PODS_ROOT"] {
    return explicit
  }
  let repoRoot = env["EXPO_ROOT_DIR"] ?? URL(fileURLWithPath: packageDir)
    .deletingLastPathComponent() // packages
    .deletingLastPathComponent() // repo root
    .path
  return "\(repoRoot)/apps/bare-expo/ios/Pods"
}

// Prebuilt xcframeworks the test bundle links against so JSI, Hermes, and
// React symbols resolve at load time. The production xcframework build leaves
// these unresolved (`-undefined dynamic_lookup`) because the host app provides
// them — but a unit-test bundle has no such host.
//
// SwiftPM requires `binaryTarget` paths to be relative to the package root,
// so the test wrapper script (`apple/scripts/test.sh`) symlinks each xcframework
// from $PODS_ROOT into `apple/.test-frameworks/` before invoking xcodebuild.
func resolveTestFrameworks(appleDir: String) -> (binaryTargets: [Target], dependencies: [Target.Dependency]) {
  let names = ["React", "hermesvm", "ReactNativeDependencies"]
  let available = names.filter({
    FileManager.default.fileExists(atPath: "\(appleDir)/.test-frameworks/\($0).xcframework")
  })
  let binaryTargets: [Target] = available.map({
    .binaryTarget(name: $0, path: "apple/.test-frameworks/\($0).xcframework")
  })
  let dependencies: [Target.Dependency] = ["ExpoModulesJSI"]
    + available.map({ .target(name: $0) })
  return (binaryTargets, dependencies)
}
