// swift-tools-version: 6.2
import PackageDescription
import Foundation

// MARK: - Autolinking JSON Model Types

/// Root structure returned by `expo-modules-autolinking resolve --json --platform apple --swiftpm`.
struct ExpoAutolinkingResult: Decodable {
  let modules: [ExpoModule]
}

/// A resolved Expo module descriptor for Apple platforms (SwiftPM mode).
struct ExpoModule: Decodable {
  let packageName: String
  let packageVersion: String
  let swiftPackage: ExpoModuleSwiftPackage?
}

struct ExpoModuleSwiftPackage: Decodable {
  let packageName: String
  let packagePath: String
  let productNames: [String]
}

// MARK: - Resolver

/// Finds the absolute path to `node` by checking common installation locations.
func findNodePath() -> String {
  let candidates = [
    "/usr/local/bin/node",        // Homebrew (Intel Mac), manual installs
    "/opt/homebrew/bin/node",     // Homebrew (Apple Silicon)
    "/usr/bin/node",              // System / Linux distro packages
  ]
  for candidate in candidates {
    if FileManager.default.isExecutableFile(atPath: candidate) {
      return candidate
    }
  }

  // Fall back to asking the user's default shell — picks up nvm, fnm, volta, asdf, etc.
  let shell = ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh"
  let probe = Process()
  probe.executableURL = URL(fileURLWithPath: shell)
  probe.arguments = ["-ilc", "which node"]
  let pipe = Pipe()
  probe.standardOutput = pipe
  probe.standardError = FileHandle.nullDevice
  try? probe.run()
  probe.waitUntilExit()

  if probe.terminationStatus == 0 {
    let output = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8)?
      .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if !output.isEmpty {
      return output
    }
  }

  fatalError("Could not find node. Install Node.js or set the NODE_BINARY environment variable.")
}

/// Resolves Expo modules by running `expo-modules-autolinking` in SwiftPM mode.
func resolveExpoModules(projectRoot: String, exclude: [String] = []) throws -> ExpoAutolinkingResult {
  let nodePath = ProcessInfo.processInfo.environment["NODE_BINARY"] ?? findNodePath()

  let packageDir = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent() // expo/
    .deletingLastPathComponent() // packages/

  let cliBin = packageDir
    .appendingPathComponent("expo-modules-autolinking")
    .appendingPathComponent("bin")
    .appendingPathComponent("expo-modules-autolinking.js")
    .path

  var arguments = [
    cliBin, "resolve", "--json", "--platform", "apple", "--swiftpm",
    "--project-root", projectRoot,
  ]
  for name in exclude {
    arguments.append(contentsOf: ["--exclude", name])
  }

  let process = Process()
  process.executableURL = URL(fileURLWithPath: nodePath)
  process.arguments = arguments

  let stdoutPipe = Pipe()
  let stderrPipe = Pipe()
  process.standardOutput = stdoutPipe
  process.standardError = stderrPipe

  try process.run()
  process.waitUntilExit()

  if process.terminationStatus != 0 {
    let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
    let stderr = String(data: stderrData, encoding: .utf8) ?? ""
    fatalError("expo-modules-autolinking exited with status \(process.terminationStatus): \(stderr)")
  }

  let data = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
  return try JSONDecoder().decode(ExpoAutolinkingResult.self, from: data)
}

// MARK: - Resolve

// TODO: The project root should be passed from the consuming app's Package.swift.
// For now, derive it relative to this file's location in the expo repo.
let projectRoot = URL(fileURLWithPath: #filePath)
  .deletingLastPathComponent() // packages/expo/
  .deletingLastPathComponent() // packages/
  .deletingLastPathComponent() // repo root
  .appendingPathComponent("apps")
  .appendingPathComponent("swiftpm-tester")
  .path

let resolved = try resolveExpoModules(projectRoot: projectRoot)

let resolvedSwiftPackages: [ExpoModuleSwiftPackage] = resolved.modules.compactMap { $0.swiftPackage }

let moduleDependencies: [Package.Dependency] = resolvedSwiftPackages.map { pkg in
  .package(name: pkg.packageName, path: pkg.packagePath)
}

let moduleTargetDependencies: [Target.Dependency] = resolvedSwiftPackages.flatMap { pkg in
  pkg.productNames.map { .product(name: $0, package: pkg.packageName) }
}

// MARK: - React precompile flags
//
// Mirrors the flags in `expo-modules-core/Package.swift`. Required here because
// `ExpoObjC`'s sources transitively import `<React/...>` headers via the
// `ExpoModulesCoreObjC` umbrella, and Clang module-building re-parses those
// headers in the importing target's compile environment.

let reactNativeVersion = "0.85.3"
let hermesVersion = "0.16.0"
let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let precompileCacheDir = URL(fileURLWithPath: "\(packageDir)/../precompile/.cache").standardized.path
let expoModulesCoreCppDir = URL(fileURLWithPath: "\(packageDir)/../expo-modules-core/common/cpp").standardized.path
let reactSliceDir = "ios-arm64_x86_64-simulator"
let reactDebugDir = "\(precompileCacheDir)/react/\(reactNativeVersion)/debug"
let reactReleaseDir = "\(precompileCacheDir)/react/\(reactNativeVersion)/release"
let rndDebugDir = "\(precompileCacheDir)/react-native-dependencies/\(reactNativeVersion)/debug"
let rndReleaseDir = "\(precompileCacheDir)/react-native-dependencies/\(reactNativeVersion)/release"
let hermesDebugDir = "\(precompileCacheDir)/hermes/\(hermesVersion)/debug/destroot/Library/Frameworks/universal"
let hermesReleaseDir = "\(precompileCacheDir)/hermes/\(hermesVersion)/release/destroot/Library/Frameworks/universal"

// `ExpoModulesCoreCommonUmbrella.h` is reached via the
// `ExpoModulesCoreObjC` umbrella; its includes need the sibling cpp dirs.
let cppHeaderFlags: [String] = [
  "-I", expoModulesCoreCppDir,
  "-I", "\(expoModulesCoreCppDir)/JSI",
  "-I", "\(expoModulesCoreCppDir)/fabric",
]

let reactDebugFlags: [String] = [
  "-ivfsoverlay", "\(reactDebugDir)/React-VFS.yaml",
  "-iframework", "\(reactDebugDir)/React.xcframework/\(reactSliceDir)",
  "-iframework", "\(rndDebugDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)",
  "-iframework", "\(hermesDebugDir)/hermesvm.xcframework/\(reactSliceDir)",
  "-I", "\(reactDebugDir)/React.xcframework/Headers",
  "-I", "\(reactDebugDir)/React.xcframework/React_Core",
  "-I", "\(reactDebugDir)/React.xcframework/Headers/React_RCTAppDelegate",
  "-I", "\(rndDebugDir)/ReactNativeDependencies.xcframework/Headers",
  "-I", "\(precompileCacheDir)/hermes/\(hermesVersion)/debug/destroot/include",
] + cppHeaderFlags
let reactReleaseFlags: [String] = [
  "-ivfsoverlay", "\(reactReleaseDir)/React-VFS.yaml",
  "-iframework", "\(reactReleaseDir)/React.xcframework/\(reactSliceDir)",
  "-iframework", "\(rndReleaseDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)",
  "-iframework", "\(hermesReleaseDir)/hermesvm.xcframework/\(reactSliceDir)",
  "-I", "\(reactReleaseDir)/React.xcframework/Headers",
  "-I", "\(reactReleaseDir)/React.xcframework/React_Core",
  "-I", "\(reactReleaseDir)/React.xcframework/Headers/React_RCTAppDelegate",
  "-I", "\(rndReleaseDir)/ReactNativeDependencies.xcframework/Headers",
  "-I", "\(precompileCacheDir)/hermes/\(hermesVersion)/release/destroot/include",
] + cppHeaderFlags
let swiftReactDebugFlags = reactDebugFlags.flatMap { ["-Xcc", $0] }
  + ["-F", "\(reactDebugDir)/React.xcframework/\(reactSliceDir)"]
  + ["-F", "\(rndDebugDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)"]
  + ["-F", "\(hermesDebugDir)/hermesvm.xcframework/\(reactSliceDir)"]
let swiftReactReleaseFlags = reactReleaseFlags.flatMap { ["-Xcc", $0] }
  + ["-F", "\(reactReleaseDir)/React.xcframework/\(reactSliceDir)"]
  + ["-F", "\(rndReleaseDir)/ReactNativeDependencies.xcframework/\(reactSliceDir)"]
  + ["-F", "\(hermesReleaseDir)/hermesvm.xcframework/\(reactSliceDir)"]

// MARK: - Return package

let package = Package(
  name: "expo",
  platforms: [
    .iOS("16.4"),
    .tvOS("16.4"),
    .macOS("13.4"),
  ],
  products: [
    .library(name: "Expo", targets: ["Expo", "ExpoObjC"])
  ],
  dependencies: moduleDependencies,
  targets: [
    .target(
      name: "Expo",
      dependencies: ["ExpoObjC"] + moduleTargetDependencies,
      path: "ios/Expo",
      swiftSettings: [
        .unsafeFlags(["-Xcc", "-fmodules"]),
        .unsafeFlags(swiftReactDebugFlags, .when(configuration: .debug)),
        .unsafeFlags(swiftReactReleaseFlags, .when(configuration: .release)),
      ]
    ),
    .target(
      name: "ExpoObjC",
      dependencies: [
        .product(name: "ExpoModulesCore", package: "expo-modules-core"),
      ],
      path: "ios/ExpoObjC",
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
      name: "ExpoTests",
      dependencies: ["Expo"],
      path: "ios/Tests",
    ),
  ],
  cxxLanguageStandard: .cxx20
)
