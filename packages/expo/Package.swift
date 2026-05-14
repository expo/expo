// swift-tools-version: 6.2
import PackageDescription
import Foundation

// MARK: - Autolinking JSON Model Types

/// Root structure returned by `expo-modules-autolinking resolve --json --platform apple`.
struct ExpoAutolinkingResult: Decodable {
  let modules: [ExpoModule]
  let coreFeatures: [String]
  let extraDependencies: [ExpoExtraDependency]
  let configuration: ExpoConfiguration?
}

/// A resolved Expo module descriptor for Apple platforms.
struct ExpoModule: Decodable {
  let packageName: String
  let packageVersion: String
  let pods: [ExpoModulePod]
  let swiftModuleNames: [String]
  let flags: ExpoModuleFlags?
  let modules: [ExpoModuleClass]
  let appDelegateSubscribers: [String]
  let reactDelegateHandlers: [String]
  let debugOnly: Bool
  let coreFeatures: [String]?
}

struct ExpoModulePod: Decodable {
  let podName: String
  let podspecDir: String
}

struct ExpoModuleFlags: Decodable {
  let inhibitWarnings: Bool?

  enum CodingKeys: String, CodingKey {
    case inhibitWarnings = "inhibit_warnings"
  }
}

struct ExpoModuleClass: Decodable {
  let name: String?
  let `class`: String
}

struct ExpoExtraDependency: Decodable {
  let name: String
  let version: String?
  let path: String?
}

struct ExpoConfiguration: Decodable {
  let buildFromSource: [String]?
}

// MARK: - Resolver

/// Finds the absolute path to `node` by checking common installation locations.
func findNodePath() -> String {
  // Check well-known paths where node is typically installed.
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

  // Fall back to asking the user's default shell to resolve it.
  // This picks up nvm, fnm, volta, asdf, etc.
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

/// Resolves Expo modules by running the `expo-modules-autolinking` CLI.
func resolveExpoModules(projectRoot: String, exclude: [String] = []) throws -> ExpoAutolinkingResult {
  let nodePath = ProcessInfo.processInfo.environment["NODE_BINARY"] ?? findNodePath()

  let packageDir = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent() // expo/
    .deletingLastPathComponent() // /

  let cliBin = packageDir
    .appendingPathComponent("expo-modules-autolinking")
    .appendingPathComponent("bin")
    .appendingPathComponent("expo-modules-autolinking.js")
    .path

  var arguments = [cliBin, "resolve", "--json", "--platform", "apple", "--project-root", projectRoot]
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

// MARK: - Resolve and build the package

// TODO: The project root should be passed from the consuming app's Package.swift.
// For now, we derive it relative to this file's location in the expo repo.
let projectRoot = URL(fileURLWithPath: #filePath)
  .deletingLastPathComponent() // packages/expo/
  .deletingLastPathComponent() // packages/
  .deletingLastPathComponent() // /
  .appendingPathComponent("apps")
  .appendingPathComponent("bare-expo")
  .path

let resolved = try resolveExpoModules(projectRoot: projectRoot)

// Map resolved modules to SwiftPM package dependencies.
// The podspecDir points to the module's iOS source directory,
// so we go up one level to find the package root containing Package.swift.
let moduleDependencies: [Package.Dependency] = resolved.modules.compactMap { module in
  guard let podspecDir = module.pods.first?.podspecDir else { return nil }
  let packagePath = URL(fileURLWithPath: podspecDir).deletingLastPathComponent().path
  return .package(path: packagePath)
}

// Collect the SwiftPM product names (based on pod names) for the target dependency list.
let moduleTargetDependencies: [Target.Dependency] = resolved.modules.compactMap { module in
  guard let pod = module.pods.first else {
    return nil
  }
  let sourceUrl = URL(fileURLWithPath: pod.podspecDir).deletingLastPathComponent()
  let hasPackageSwift = FileManager.default.fileExists(
    atPath: sourceUrl.appendingPathComponent("Package.swift").path
  )
  if !hasPackageSwift {
    return nil
  }
  return .product(name: pod.podName, package: module.packageName)
}

// MARK: - debugging

let dependencies: [Package.Dependency] = resolved.modules.compactMap { module in
  guard let podspecDir = module.pods.first?.podspecDir else {
    return nil
  }
  let sourceUrl = URL(fileURLWithPath: podspecDir).deletingLastPathComponent()
  let hasPackageSwift = FileManager.default.fileExists(
    atPath: sourceUrl.appendingPathComponent("Package.swift").path
  )
  if !hasPackageSwift {
    return nil
  }
  print("DUPA #2", module.packageName, module.packageVersion, sourceUrl.path)
  return .package(name: module.packageName, path: sourceUrl.path)
}

print("DUPA #3", dependencies)

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
  dependencies: [
    .package(name: "expo-modules-core", path: "../expo-modules-core"),
  ] + dependencies,
  targets: [
    .target(
      name: "Expo",
      dependencies: [
        "ExpoObjC",
        .product(name: "ExpoModulesCore", package: "expo-modules-core"),
      ] + moduleTargetDependencies,
      path: "ios/Expo",
    ),
    .target(
      name: "ExpoObjC",
      dependencies: [
        .product(name: "ExpoModulesCore", package: "expo-modules-core"),
      ],
      path: "ios/ExpoObjC",
      publicHeadersPath: "include",
    ),
    .testTarget(
      name: "ExpoTests",
      dependencies: ["Expo"],
      path: "ios/Tests",
    ),
  ]
)
