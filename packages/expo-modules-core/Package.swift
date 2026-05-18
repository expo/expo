// swift-tools-version: 6.2
import PackageDescription
import Foundation

// MARK: - Precompile paths
//
// React, Hermes, and ReactNativeDependencies are consumed as prebuilt
// xcframeworks produced by `packages/precompile` and cached under
// `packages/precompile/.cache/<lib>/<version>/<config>/...`. Versions are
// pinned for now — eventually they should be discovered from the consuming
// app's `package.json` / `node_modules`.

let reactNativeVersion = "0.85.3"
let hermesVersion = "0.16.0"

let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let precompileCacheDir = URL(fileURLWithPath: "\(packageDir)/../precompile/.cache").standardized.path

// Read the package version from package.json so we can mirror CocoaPods'
// `GCC_PREPROCESSOR_DEFINITIONS = EXPO_MODULES_CORE_VERSION=<version>`. The
// version is consumed by `CoreModuleHelper.m` to expose `CoreModuleHelper.getVersion`.
let expoModulesCoreVersion: String = {
  let url = URL(fileURLWithPath: "\(packageDir)/package.json")
  guard
    let data = try? Data(contentsOf: url),
    let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
    let version = json["version"] as? String
  else {
    fatalError("Could not read `version` from \(url.path). Ensure the file exists and is valid JSON.")
  }
  return version
}()

let reactDebugDir = "\(precompileCacheDir)/react/\(reactNativeVersion)/debug"
let reactReleaseDir = "\(precompileCacheDir)/react/\(reactNativeVersion)/release"
let rndDebugDir = "\(precompileCacheDir)/react-native-dependencies/\(reactNativeVersion)/debug"
let rndReleaseDir = "\(precompileCacheDir)/react-native-dependencies/\(reactNativeVersion)/release"
let hermesDebugDir = "\(precompileCacheDir)/hermes/\(hermesVersion)/debug/destroot/Library/Frameworks/universal"
let hermesReleaseDir = "\(precompileCacheDir)/hermes/\(hermesVersion)/release/destroot/Library/Frameworks/universal"

// Header search paths for Clang and Swift target compiles. The React VFS overlay
// remaps React's flat header layout to the `<React/...>` form the framework's
// own umbrella expects. `-iframework` points at the simulator slice; device-slice
// support is a TODO.
let reactSliceDir = "ios-arm64_x86_64-simulator"
let reactDebugFlags: [String] = [
  "-ivfsoverlay", "\(reactDebugDir)/React-VFS.yaml",
  "-iframework", "\(reactDebugDir)/React.xcframework/\(reactSliceDir)",
  "-iframework", "\(rndDebugDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)",
  "-iframework", "\(hermesDebugDir)/hermesvm.xcframework/\(reactSliceDir)",
  "-I", "\(reactDebugDir)/React.xcframework/Headers",
  "-I", "\(reactDebugDir)/React.xcframework/React_Core",
  "-I", "\(rndDebugDir)/ReactNativeDependencies.xcframework/Headers",
  "-I", "\(precompileCacheDir)/hermes/\(hermesVersion)/debug/destroot/include",
]
let reactReleaseFlags: [String] = [
  "-ivfsoverlay", "\(reactReleaseDir)/React-VFS.yaml",
  "-iframework", "\(reactReleaseDir)/React.xcframework/\(reactSliceDir)",
  "-iframework", "\(rndReleaseDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)",
  "-iframework", "\(hermesReleaseDir)/hermesvm.xcframework/\(reactSliceDir)",
  "-I", "\(reactReleaseDir)/React.xcframework/Headers",
  "-I", "\(reactReleaseDir)/React.xcframework/React_Core",
  "-I", "\(rndReleaseDir)/ReactNativeDependencies.xcframework/Headers",
  "-I", "\(precompileCacheDir)/hermes/\(hermesVersion)/release/destroot/include",
]

let swiftReactDebugFlags = reactDebugFlags.flatMap { ["-Xcc", $0] }
  + ["-F", "\(reactDebugDir)/React.xcframework/\(reactSliceDir)"]
  + ["-F", "\(rndDebugDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)"]
  + ["-F", "\(hermesDebugDir)/hermesvm.xcframework/\(reactSliceDir)"]
let swiftReactReleaseFlags = reactReleaseFlags.flatMap { ["-Xcc", $0] }
  + ["-F", "\(reactReleaseDir)/React.xcframework/\(reactSliceDir)"]
  + ["-F", "\(rndReleaseDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)"]
  + ["-F", "\(hermesReleaseDir)/hermesvm.xcframework/\(reactSliceDir)"]

// MARK: - Package

let package = Package(
  name: "expo-modules-core",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
    .macOS("13.4"),
  ],
  products: [
    .library(
      name: "ExpoModulesCore",
      targets: ["ExpoModulesCore", "ExpoModulesCoreObjC", "ExpoModulesCoreCommon"]
    ),
    .library(
      name: "ExpoModulesWorklets",
      targets: ["ExpoModulesWorklets", "ExpoModulesWorkletsObjC"]
    ),
    // ExpoModulesWorkletsAdapter is intentionally not exported as a SwiftPM
    // library. It pulls in `react-native-worklets`, which is an opt-in
    // runtime dep that not every app installs.
  ],
  dependencies: [
    .package(name: "expo-modules-jsi", path: "../expo-modules-jsi"),
  ],
  targets: [
    .target(
      name: "ExpoModulesCore",
      dependencies: [
        "ExpoModulesCoreObjC",
        .product(name: "ExpoModulesJSI", package: "expo-modules-jsi"),
      ],
      path: "ios/ExpoModulesCore",
      swiftSettings: [
        .define("RCT_NEW_ARCH_ENABLED"),
        .unsafeFlags(["-Xcc", "-fmodules"]),
        .unsafeFlags(swiftReactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(swiftReactReleaseFlags, .when(configuration: .release)),
      ]
    ),
    .target(
      name: "ExpoModulesCoreObjC",
      dependencies: [
        "ExpoModulesCoreCommon",
        .product(name: "ExpoModulesJSI", package: "expo-modules-jsi"),
      ],
      path: "ios/ExpoModulesCoreObjC",
      publicHeadersPath: "include",
      cSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        .define("EXPO_MODULES_CORE_VERSION", to: expoModulesCoreVersion),
        // Common cpp's headers include each other via bare-quoted paths like
        // `"JSIUtils.h"` (sibling of where the header itself lives). Add the
        // cpp subdirs so transitive includes from ObjC++ sources resolve.
        .headerSearchPath("../../common/cpp/JSI"),
        .headerSearchPath("../../common/cpp/fabric"),
        .unsafeFlags(["-fmodules"]),
        .unsafeFlags(reactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(reactReleaseFlags, .when(configuration: .release)),
      ],
      cxxSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        .define("EXPO_MODULES_CORE_VERSION", to: expoModulesCoreVersion),
        .headerSearchPath("../../common/cpp/JSI"),
        .headerSearchPath("../../common/cpp/fabric"),
        .unsafeFlags(["-fmodules"]),
        .unsafeFlags(reactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(reactReleaseFlags, .when(configuration: .release)),
      ]
    ),
    .target(
      name: "ExpoModulesCoreCommon",
      dependencies: [
        .product(name: "ExpoModulesJSI", package: "expo-modules-jsi"),
      ],
      path: "common/cpp",
      publicHeadersPath: ".",
      cSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        // Root-level cpp headers use bare-quoted includes like `"JSIUtils.h"`
        // for files that live under JSI/ or fabric/. Add those subdirs so the
        // includes resolve.
        .headerSearchPath("JSI"),
        .headerSearchPath("fabric"),
        .unsafeFlags(["-fmodules"]),
        .unsafeFlags(reactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(reactReleaseFlags, .when(configuration: .release)),
      ],
      cxxSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        .headerSearchPath("JSI"),
        .headerSearchPath("fabric"),
        .unsafeFlags(["-fmodules"]),
        .unsafeFlags(reactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(reactReleaseFlags, .when(configuration: .release)),
      ]
    ),
    .target(
      name: "ExpoModulesWorklets",
      dependencies: [
        "ExpoModulesWorkletsObjC",
        "ExpoModulesCore",
        .product(name: "ExpoModulesJSI", package: "expo-modules-jsi"),
      ],
      path: "ios/ExpoModulesWorklets",
      swiftSettings: [
        .unsafeFlags(["-Xcc", "-fmodules"]),
        .unsafeFlags(swiftReactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(swiftReactReleaseFlags, .when(configuration: .release)),
      ]
    ),
    .target(
      name: "ExpoModulesWorkletsObjC",
      dependencies: ["ExpoModulesCoreObjC"],
      path: "ios/ExpoModulesWorkletsObjC",
      publicHeadersPath: "include",
      cSettings: [
        .unsafeFlags(["-fmodules"]),
        .unsafeFlags(reactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(reactReleaseFlags, .when(configuration: .release)),
      ],
      cxxSettings: [
        .unsafeFlags(["-fmodules"]),
        .unsafeFlags(reactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(reactReleaseFlags, .when(configuration: .release)),
      ]
    ),
    .testTarget(
      name: "ExpoModulesCoreTests",
      dependencies: ["ExpoModulesCore"],
      path: "ios/Tests",
      exclude: ["EXAppDefinesTest.m"],
    ),
  ],
  cxxLanguageStandard: .cxx20
)
