// swift-tools-version: 5.9
// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation
import PackageDescription

let packageVersion = "3.0.16"
let packageRootPath = "/Users/chrfalch/repos/expo/expo/packages/expo-modules-core"

let targets: [BaseTarget] = [
      CPPTarget(
          name: "ExpoModulesJSI_common_cpp",
          dependencies: ["Hermes", "React", "ReactNativeDependencies"],
          path: ".build/source/expo-modules-core/ExpoModulesJSI/ExpoModulesJSI_common_cpp",
          includeDirectories: ["include"],linkedFrameworks: [  ]
      ),
  ObjCTarget(
          name: "ExpoModulesJSI_ios_objc",
          dependencies: ["Hermes", "React", "ReactNativeDependencies", "ExpoModulesJSI_common_cpp"],
          path: ".build/source/expo-modules-core/ExpoModulesJSI/ExpoModulesJSI_ios_objc",
          includeDirectories: ["include"],linkedFrameworks: [ "Foundation" ]
      ),
  CPPTarget(
          name: "ExpoModulesCore_common_cpp",
          dependencies: ["Hermes", "React", "ReactNativeDependencies", "ExpoModulesJSI_common_cpp"],
          path: ".build/source/expo-modules-core/ExpoModulesCore/ExpoModulesCore_common_cpp",
          includeDirectories: ["include"],linkedFrameworks: [  ]
      ),
  ObjCTarget(
          name: "ExpoModulesCore_ios_objc",
          dependencies: ["Hermes", "React", "ReactNativeDependencies", "ExpoModulesJSI_common_cpp", "ExpoModulesJSI_ios_objc", "ExpoModulesCore_common_cpp"],
          path: ".build/source/expo-modules-core/ExpoModulesCore/ExpoModulesCore_ios_objc",
          includeDirectories: ["include"],linkedFrameworks: [ "Foundation", "UserNotifications", "AVKit", "AVFoundation", "UIKit" ]
      ),
  SwiftTarget(
          name: "ExpoModulesCore",
          dependencies: ["Hermes", "React", "ReactNativeDependencies", "ExpoModulesJSI_common_cpp", "ExpoModulesJSI_ios_objc", "ExpoModulesCore_common_cpp", "ExpoModulesCore_ios_objc"],
          path: ".build/source/expo-modules-core/ExpoModulesCore/ExpoModulesCore",
          linkedFrameworks: [ "Foundation", "Combine", "CoreGraphics", "CoreMedia", "SwiftUI" ]
      ),
FrameworkTarget(
    name: "ReactNativeDependencies",
    path: ".dependencies/ReactNativeDependencies/ReactNativeDependencies.xcframework",
    includeDirectories: ["Headers"]),
FrameworkTarget(
    name: "React",
    path: ".dependencies/React-Core-prebuilt/React.xcframework",
    includeDirectories: ["Headers", "React_Core"],
    headerMapPath: ".dependencies/React-Core-prebuilt/React-Headers.hmap",
    vfsOverlayPath: ".dependencies/React-Core-prebuilt/React-VFS.yaml"
),
FrameworkTarget(
    name: "Hermes",
    path: ".dependencies/Hermes/destroot/Library/Frameworks/universal/hermesvm.xcframework",
    includeDirectories: ["../../../../include"]
)
]

let package = Package(
    name: "expo-modules-core",

    platforms: [
        .iOS(.v15)
    ],

    products: [
            .library(
      name: "ExpoModulesJSI",
      type: .dynamic,
      targets: ["ExpoModulesJSI_ios_objc"]
    ),
    .library(
      name: "ExpoModulesCore",
      type: .dynamic,
      targets: ["ExpoModulesCore"]
    )
    ],

    targets: targets.map {
        $0.createTarget(allTargets: targets)
    },

    swiftLanguageVersions: [.version("6.0")],
    cxxLanguageStandard: .cxx20
)

// MARK: - BaseTarget Class

class BaseTarget {
    let name: String
    let path: String
    let includeDirectories: [String]
    let linkedFrameworks: [String]

    init(
        name: String,
        path: String,
        includeDirectories: [String] = ["include"],
        linkedFrameworks: [String] = []
    ) {
        self.name = name
        self.path = path
        self.includeDirectories = includeDirectories
        self.linkedFrameworks = linkedFrameworks
    }

    // Abstract method to be implemented by subclasses
    func createTarget(allTargets: [BaseTarget]) -> Target {
        fatalError("Subclasses must implement createTarget(allTargets:)")
    }
}

class SourceTarget: BaseTarget {
    let exclude: [String]

    init(
        name: String,
        path: String,
        exclude: [String] = [],
        includeDirectories: [String] = ["include"],
        linkedFrameworks: [String] = []
    ) {
        self.exclude = exclude
        super.init(
            name: name, path: path, includeDirectories: includeDirectories,
            linkedFrameworks: linkedFrameworks)
    }
}

// MARK: - DependencyResolvingTarget Class

/// Base class for targets that have dependencies and need to resolve include paths
class DependencyResolvingTarget: SourceTarget {
    let dependencies: [String]

    init(
        name: String, dependencies: [String], path: String,
        exclude: [String] = [],
        includeDirectories: [String] = ["include"],
        linkedFrameworks: [String] = []
    ) {
        self.dependencies = dependencies
        super.init(
            name: name, path: path, exclude: exclude, includeDirectories: includeDirectories,
            linkedFrameworks: linkedFrameworks)
    }

    /// Returns an absolute path for a given relative (to the package root) or already absolute path.
    func absolutePath(forRelativeOrAbsolute path: String) -> String {
        if path.hasPrefix("/") {
            return path
        }
        return "\(packageRootPath)/\(path)"
    }

    /// Resolves dependencies and returns separate lists for include paths, framework search paths, header maps, and VFS overlays
    /// - Parameter targets: List of all available BaseTargets
    /// - Returns: Tuple of (includePaths, frameworkPaths, headerMapPaths, vfsOverlayPaths)
    func resolveDependencies(from targets: [BaseTarget]) -> (
        includePaths: [String], frameworkPaths: [String], headerMapPaths: [String],
        vfsOverlayPaths: [String]
    ) {
        var includePaths: [String] = []
        var frameworkPaths: [String] = []
        var headerMapPaths: [String] = []
        var vfsOverlayPaths: [String] = []

        for dependencyName in dependencies {
            // Find the dependency target
            guard let dependencyTarget = targets.first(where: { $0.name == dependencyName }) else {
                fatalError("Could not find dependency target: \(dependencyName)")
            }

            if let frameworkTarget = dependencyTarget as? FrameworkTarget {
                // Add VFS overlay if present (preferred over header map)
                if let vfsOverlayPath = frameworkTarget.vfsOverlayPath {
                    vfsOverlayPaths.append(vfsOverlayPath)
                    // When using VFS overlay, add header paths but NOT framework path
                    // This prevents the compiler from trying to load the framework's module map
                    for includeDir in frameworkTarget.includeDirectories {
                        let dependencyIncludePath = "\(frameworkTarget.path)/\(includeDir)"
                        includePaths.append(dependencyIncludePath)
                    }
                }
                // Add header map if present (for React/ prefixed headers) - used as fallback
                else if let headerMapPath = frameworkTarget.headerMapPath {
                    headerMapPaths.append(headerMapPath)
                    // Always add regular header paths (for jsi/, react/, etc.)
                    for includeDir in frameworkTarget.includeDirectories {
                        let dependencyIncludePath = "\(frameworkTarget.path)/\(includeDir)"
                        includePaths.append(dependencyIncludePath)
                    }
                    // For Swift, add the framework search path (directory containing .framework)
                    frameworkPaths.append(frameworkTarget.path)
                } else {
                    // No VFS overlay or header map - use framework normally
                    for includeDir in frameworkTarget.includeDirectories {
                        let dependencyIncludePath = "\(frameworkTarget.path)/\(includeDir)"
                        includePaths.append(dependencyIncludePath)
                    }
                    // For Swift, add the framework search path (directory containing .framework)
                    frameworkPaths.append(frameworkTarget.path)
                }
            } else {
                // For regular targets, add header include paths
                for includeDir in dependencyTarget.includeDirectories {
                    let dependencyIncludePath = "\(dependencyTarget.path)/\(includeDir)"
                    includePaths.append(dependencyIncludePath)
                }
            }
        }

        // Header map and VFS directories are not needed in framework paths
        return (includePaths, frameworkPaths, headerMapPaths, vfsOverlayPaths)
    }

    /// Calculates the relative path from one directory to another
    func calculateRelativePath(from sourcePath: String, to targetPath: String) -> String {
        let sourceComponents = sourcePath.split(separator: "/").map(String.init)
        let targetComponents = targetPath.split(separator: "/").map(String.init)

        // Find common prefix
        var commonLength = 0
        for i in 0..<min(sourceComponents.count, targetComponents.count) {
            if sourceComponents[i] == targetComponents[i] {
                commonLength += 1
            } else {
                break
            }
        }

        // Build relative path
        let upLevels = sourceComponents.count - commonLength
        let downPath = targetComponents[commonLength...].joined(separator: "/")

        if upLevels == 0 {
            return downPath
        } else {
            let upPath = Array(repeating: "..", count: upLevels).joined(separator: "/")
            return downPath.isEmpty ? upPath : "\(upPath)/\(downPath)"
        }
    }

    /// Extracts the root path from a VFS overlay YAML file.
    /// The VFS overlay YAML has a structure like:
    /// ```
    /// version: 0
    /// case-sensitive: false
    /// roots:
    ///   - name: '/path/to/root'
    /// ```
    /// This function parses the YAML and returns the first root's name path.
    /// - Parameter vfsOverlayPath: Path to the VFS overlay YAML file (relative or absolute)
    /// - Returns: The root path if found, nil otherwise
    func extractVFSOverlayRootPath(from vfsOverlayPath: String) -> String? {
        let absoluteVfsPath = absolutePath(forRelativeOrAbsolute: vfsOverlayPath)

        guard let yamlContent = try? String(contentsOfFile: absoluteVfsPath, encoding: .utf8) else {
            print("[WARNING] Could not read VFS overlay file: \(absoluteVfsPath)")
            return nil
        }

        // Simple YAML parsing to extract the first root's name
        // Looking for pattern like:
        //   - name: '/path/to/root'
        let lines = yamlContent.components(separatedBy: .newlines)
        var inRoots = false

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            if trimmed == "roots:" {
                inRoots = true
                continue
            }

            if inRoots && trimmed.hasPrefix("- name:") {
                // Extract the path from "- name: '/path/to/root'" or "- name: '/path/to/root'"
                let nameValue = trimmed.dropFirst("- name:".count).trimmingCharacters(in: .whitespaces)
                // Remove quotes if present
                let cleanPath = nameValue.trimmingCharacters(in: CharacterSet(charactersIn: "\"'"))
                return cleanPath
            }
        }

        return nil
    }
}

// MARK: - FrameworkTarget Class

class FrameworkTarget: BaseTarget {
    let headerMapPath: String?
    let vfsOverlayPath: String?

    convenience init(name: String, path: String) {
        self.init(
            name: name, path: path, includeDirectories: [], headerMapPath: nil, vfsOverlayPath: nil)
    }

    init(
        name: String, path: String, includeDirectories: [String] = [], headerMapPath: String? = nil,
        vfsOverlayPath: String? = nil,
        linkedFrameworks: [String] = []
    ) {
        self.headerMapPath = headerMapPath
        self.vfsOverlayPath = vfsOverlayPath
        // For frameworks, includeDirectories contains the header locations within the framework bundle
        super.init(
            name: name, path: path, includeDirectories: includeDirectories,
            linkedFrameworks: linkedFrameworks)
    }

    override func createTarget(allTargets: [BaseTarget]) -> Target {
        return .binaryTarget(
            name: name,
            path: path
        )
    }
}

// MARK: - SwiftTarget Class

class SwiftTarget: DependencyResolvingTarget {
    /// Path to a bridging header for importing Objective-C types into Swift
    let bridgingHeader: String?

    init(
        name: String,
        dependencies: [String],
        path: String,
        exclude: [String] = [],
        includeDirectories: [String] = [],
        linkedFrameworks: [String] = [],
        bridgingHeader: String? = nil
    ) {
        self.bridgingHeader = bridgingHeader
        super.init(
            name: name,
            dependencies: dependencies,
            path: path,
            exclude: exclude,
            includeDirectories: includeDirectories,
            linkedFrameworks: linkedFrameworks
        )
    }

    /// Creates a Swift Package Manager Target with dependency resolution
    /// - Parameter allTargets: List of all available targets to search for dependencies
    /// - Returns: A configured Target for use in a Swift Package
    override func createTarget(allTargets: [BaseTarget]) -> Target {
        let targetDependencies: [Target.Dependency] = dependencies.map { .target(name: $0) }

        // Resolve dependencies into include paths and framework search paths
        let resolvedDependencies = resolveDependencies(from: allTargets)
        let includePaths = resolvedDependencies.includePaths
        var frameworkPaths = resolvedDependencies.frameworkPaths
        let headerMapPaths = resolvedDependencies.headerMapPaths
        let vfsOverlayPaths = resolvedDependencies.vfsOverlayPaths

        // Ensure the framework search paths contain the parent directories of header maps as well
        for headerMapPath in headerMapPaths {
            let absoluteHeaderMapPath = absolutePath(forRelativeOrAbsolute: headerMapPath)
            let headerMapDirectory = URL(fileURLWithPath: absoluteHeaderMapPath)
                .deletingLastPathComponent().path
            if !frameworkPaths.contains(headerMapDirectory) {
                frameworkPaths.append(headerMapDirectory)
            }
        }

        // Convert include paths to Swift compiler flags (-Xcc -I for each path)
        var swiftImportFlags = includePaths.flatMap { path in
            ["-Xcc", "-I", "-Xcc", path]
        }

        // Add framework search paths as Swift compiler flags (-Xcc -F for each path)
        swiftImportFlags += frameworkPaths.flatMap { path in
            ["-Xcc", "-F", "-Xcc", path]
        }

        // Add VFS overlay paths (preferred) - used by swift when creating clang modules
        swiftImportFlags += vfsOverlayPaths.flatMap { path in
            let absolutePath = absolutePath(forRelativeOrAbsolute: path)
            return ["-Xcc", "-ivfsoverlay", "-Xcc", absolutePath]
        }

        // Extract and add VFS root paths as header search paths
        for vfsPath in vfsOverlayPaths {
            if let rootPath = extractVFSOverlayRootPath(from: vfsPath) {
                swiftImportFlags += ["-Xcc", "-I", "-Xcc", rootPath]
            }
        }

        // Add header map paths (fallback if no VFS overlay)
        swiftImportFlags += headerMapPaths.flatMap { path in
            let absolutePath = absolutePath(forRelativeOrAbsolute: path)
            return ["-Xcc", "-I", "-Xcc", absolutePath]
        }

        // Log Swift target search paths
        print("\n========================================")
        print("[\(name)] SwiftTarget")
        print("========================================")
        if !dependencies.isEmpty {
            print("  Dependencies:")
            for dep in dependencies {
                print("    • \(dep)")
            }
        }
        if !includePaths.isEmpty {
            print("  -I paths:")
            for path in includePaths {
                print("    • \(path)")
            }
        }
        if !frameworkPaths.isEmpty {
            print("  -F paths:")
            for path in frameworkPaths {
                print("    • \(path)")
            }
        }
        if !vfsOverlayPaths.isEmpty {
            print("  VFS overlays:")
            for path in vfsOverlayPaths {
                print("    • \(path)")
            }
        }
        if !headerMapPaths.isEmpty {
            print("  Header maps:")
            for path in headerMapPaths {
                print("    • \(path)")
            }
        }
        if let bridgingHeader = bridgingHeader {
            print("  Bridging header: \(bridgingHeader)")
        }
        print("========================================\n")

        var settings: [SwiftSetting] = []

        settings.append(.enableUpcomingFeature("LibraryEvolution"))

        // Define RCT_NEW_ARCH_ENABLED for Fabric support - this must be set when building
        // xcframeworks so that ExpoView resolves to ExpoFabricView instead of ExpoClassicView
        settings.append(
            .define("RCT_NEW_ARCH_ENABLED")
        )

        // Enable C++ and Clang modules
        settings.append(
            .unsafeFlags(
                ["-Xcc", "-fcxx-modules", "-Xcc", "-fmodules"],
                .when(platforms: [.iOS, .macOS, .tvOS, .macCatalyst])
            )
        )

        if !swiftImportFlags.isEmpty {
            settings.append(
                .unsafeFlags(
                    swiftImportFlags,
                    .when(platforms: [.iOS, .macOS, .tvOS, .macCatalyst])
                )
            )
        }

        // Add bridging header for importing Objective-C types into Swift
        if let bridgingHeader = bridgingHeader {
            let absoluteBridgingHeader = absolutePath(forRelativeOrAbsolute: bridgingHeader)
            settings.append(
                .unsafeFlags(
                    [
                        "-import-objc-header", absoluteBridgingHeader,
                        // Disable implicit module maps to prevent cyclic module dependency errors
                        // when bridging header imports ObjC headers that have cross-module imports
                        "-Xcc", "-fno-implicit-module-maps"
                    ],
                    .when(platforms: [.iOS, .macOS, .tvOS, .macCatalyst])
                )
            )
        }

        // Add system library linker settings
        var linkerSettings: [LinkerSetting] = []
        for systemLibrary in linkedFrameworks {
            linkerSettings.append(.linkedFramework(systemLibrary))
        }

        return .target(
            name: name,
            dependencies: targetDependencies,
            path: path,
            exclude: exclude,
            swiftSettings: settings,
            linkerSettings: linkerSettings
        )
    }
}

// MARK: - ObjCTarget Class

class ObjCTarget: DependencyResolvingTarget {
    let useIncludesFrom: [String]
    let plugins: [String]
    let vfsOverlayPath: String?

    init(
        name: String,
        dependencies: [String],
        path: String,
        exclude: [String] = [],
        includeDirectories: [String] = ["include"],
        useIncludesFrom: [String] = [],
        linkedFrameworks: [String] = [],
        plugins: [String] = [],
        vfsOverlayPath: String? = nil
    ) {
        self.useIncludesFrom = useIncludesFrom
        self.plugins = plugins
        self.vfsOverlayPath = vfsOverlayPath

        super.init(
            name: name,
            dependencies: dependencies,
            path: path,
            exclude: exclude,
            includeDirectories: includeDirectories,
            linkedFrameworks: linkedFrameworks)
    }

    /// Creates a Swift Package Manager Target from this ObjCTarget
    /// - Parameter allTargets: List of all available targets to search for dependencies
    /// - Returns: A configured Target for use in a Swift Package
    override func createTarget(allTargets: [BaseTarget]) -> Target {
        // Convert dependencies to Target.Dependency without filtering so they remain explicit
        let targetDependencies: [Target.Dependency] = dependencies.map { depName in
            .target(name: depName)
        }

        // Resolve dependencies into include paths and framework search paths
        let resolvedDependencies = resolveDependencies(from: allTargets)
        var includePaths = resolvedDependencies.includePaths
        let frameworkPaths = resolvedDependencies.frameworkPaths
        let headerMapPaths = resolvedDependencies.headerMapPaths

        // Collect all VFS overlay paths:
        // 1. From binary framework dependencies
        // 2. From this target's own vfsOverlayPath
        var vfsOverlayPaths = resolvedDependencies.vfsOverlayPaths
        var vfsRootPaths: [String] = []
        if let targetVfsOverlay = vfsOverlayPath {
            vfsOverlayPaths.append(targetVfsOverlay)
            // Extract the root path from the VFS overlay and add it as a header search path
            if let rootPath = extractVFSOverlayRootPath(from: targetVfsOverlay) {
                vfsRootPaths.append(rootPath)
            }
        }


        // Merge additional include paths sourced from other ObjCTargets specified via useIncludesFrom
        for includeTargetName in useIncludesFrom {
            guard let includeTarget = allTargets.first(where: { $0.name == includeTargetName })
            else {
                fatalError("Could not find target listed in useIncludesFrom: \(includeTargetName)")
            }

            guard let objcIncludeTarget = includeTarget as? ObjCTarget else {
                fatalError(
                    "Target '\(includeTargetName)' referenced in useIncludesFrom is not an ObjCTarget"
                )
            }

            for includeDir in objcIncludeTarget.includeDirectories {
                let includePath = "\(objcIncludeTarget.path)/\(includeDir)"
                includePaths.append(includePath)
            }
        }

        // Add self.includes so that #import "self.h" will work
        self.includeDirectories.forEach { includeDir in
            let selfIncludePath = "\(path)/\(includeDir)"
            if !includePaths.contains(selfIncludePath) {
                // Note: This modifies the local includePaths variable only
                // The original self.includeDirectories remains unchanged
                // This is important to avoid adding duplicate paths in subsequent calls
                // to createTarget() for multiple targets sharing the same dependency
                // e.g., if ObjCTarget A depends on ObjCTarget B, and both
                includePaths.append(selfIncludePath + "/ExpoModulesCore")
            }
        }

        // Header maps don't need their parent directory added to framework search paths
        // They are passed directly via -I flags

        // Combine all paths (include directories and framework search paths)
        let dependencyPaths = includePaths + frameworkPaths

        // Convert to relative paths (avoids leaking absolute paths into build settings) and deduplicate
        var headerSearchPaths: [String] = []
        var seenHeaderSearchPaths = Set<String>()
        for dependencyPath in dependencyPaths {
            let relativePath = calculateRelativePath(from: path, to: dependencyPath)
            if seenHeaderSearchPaths.insert(relativePath).inserted {
                headerSearchPaths.append(relativePath)
            }
        }

        // Note: Header maps are NOT added as regular header search paths
        // They will be added via unsafe flags below

        // Create CXXSetting and CSetting for each header search path
        var cxxSettings: [CXXSetting] = headerSearchPaths.map { .headerSearchPath($0) }
        var cSettings: [CSetting] = headerSearchPaths.map { .headerSearchPath($0) }

        // Add the target's own include directory to header search paths
        // This allows quoted imports like #import "Header.h" to find headers in include/ProductName/
        let ownIncludePath = includeDirectories.first ?? "include"
        cSettings.append(.headerSearchPath(ownIncludePath))
        cxxSettings.append(.headerSearchPath(ownIncludePath))

        // Also add any subdirectories under the include path (for product-named folders like include/ExpoModulesJSI/)
        // This allows quoted imports to find headers without the product prefix
        let absoluteIncludePath = absolutePath(forRelativeOrAbsolute: "\(path)/\(ownIncludePath)")
        if let subdirs = try? FileManager.default.contentsOfDirectory(atPath: absoluteIncludePath) {
            for subdir in subdirs {
                var isDir: ObjCBool = false
                let subdirPath = "\(absoluteIncludePath)/\(subdir)"
                if FileManager.default.fileExists(atPath: subdirPath, isDirectory: &isDir), isDir.boolValue {
                    let relativeSubdirPath = "\(ownIncludePath)/\(subdir)"
                    cSettings.append(.headerSearchPath(relativeSubdirPath))
                    cxxSettings.append(.headerSearchPath(relativeSubdirPath))
                }
            }
        }

        // For merged targets (like SCCM_objc), add include paths from all sibling targets
        // This handles cross-product imports like #import <ExpoModulesCore/Header.h> when the
        // merged target is in ExpoModulesJSI but contains files that import ExpoModulesCore headers
        var siblingIncludePaths: [String] = []
        for siblingTarget in allTargets {
            guard siblingTarget.name != name else { continue }
            for includeDir in siblingTarget.includeDirectories {
                let siblingIncludePath = "\(siblingTarget.path)/\(includeDir)"
                let relativeSiblingPath = calculateRelativePath(from: path, to: siblingIncludePath)
                if seenHeaderSearchPaths.insert(relativeSiblingPath).inserted {
                    cSettings.append(.headerSearchPath(relativeSiblingPath))
                    cxxSettings.append(.headerSearchPath(relativeSiblingPath))
                    siblingIncludePaths.append(relativeSiblingPath)
                }
            }
        }
        if !siblingIncludePaths.isEmpty {
            print("  Sibling include paths added:")
            for p in siblingIncludePaths {
                print("    • \(p)")
            }
        }

        // VFS overlays need to be added via unsafe flags (absolute paths) - preferred!
        let vfsOverlayFlags = vfsOverlayPaths.flatMap { path -> [String] in
            let absolute = absolutePath(forRelativeOrAbsolute: path)
            print("[DEBUG] VFS overlay absolute path: \(absolute)")
            return ["-ivfsoverlay", absolute]
        }

         // VFS root paths need to be added as header search paths (-I flags)
        let vfsRootFlags = vfsRootPaths.flatMap { path -> [String] in
            print("[DEBUG] VFS root path added as -I: \(path)")
            return ["-I", path]
        }

        // Header maps need to be added via unsafe flags (absolute paths) - fallback
        let headerMapFlags = headerMapPaths.flatMap { path -> [String] in
            let absolute = absolutePath(forRelativeOrAbsolute: path)
            return ["-I", absolute]
        }

        if !vfsOverlayFlags.isEmpty {
            cSettings.append(.unsafeFlags(vfsOverlayFlags))
            cxxSettings.append(.unsafeFlags(vfsOverlayFlags))
        }

         if !vfsRootFlags.isEmpty {
            cSettings.append(.unsafeFlags(vfsRootFlags))
            cxxSettings.append(.unsafeFlags(vfsRootFlags))
        }

        if !headerMapFlags.isEmpty {
            cSettings.append(.unsafeFlags(headerMapFlags))
            cxxSettings.append(.unsafeFlags(headerMapFlags))
        }

        // Log ObjC/C++ target search paths
        let targetType = self is CPPTarget ? "CPPTarget" : "ObjCTarget"
        print("\n========================================")
        print("[\(name)] \(targetType)")
        print("========================================")
        if !dependencies.isEmpty {
            print("  All dependencies:")
            for dep in dependencies {
                print("    • \(dep)")
            }
        }
        if !useIncludesFrom.isEmpty {
            print("  useIncludesFrom (header-only includes):")
            for dep in useIncludesFrom {
                print("    • \(dep)")
            }
        }
        if !includePaths.isEmpty {
            print("  -I paths (absolute):")
            for path in includePaths {
                print("    • \(path)")
            }
        }
        if !frameworkPaths.isEmpty {
            print("  -F paths (absolute):")
            for path in frameworkPaths {
                print("    • \(path)")
            }
        }
        if !vfsOverlayPaths.isEmpty {
            print("  VFS overlays:")
            for path in vfsOverlayPaths {
                print("    • \(path)")
            }
        }
        if !vfsRootPaths.isEmpty {
            print("  VFS root paths (added as -I):")
            for path in vfsRootPaths {
                print("    • \(path)")
            }
        }
        if !headerMapPaths.isEmpty {
            print("  Header maps:")
            for path in headerMapPaths {
                print("    • \(path)")
            }
        }
        if !headerSearchPaths.isEmpty {
            print("  Relative header search paths:")
            for path in headerSearchPaths {
                print("    • \(path)")
            }
        }
        print("========================================\n")

        if !packageVersion.isEmpty {
            cSettings.append(.define("EXPO_MODULES_CORE_VERSION", to: packageVersion))
            cxxSettings.append(.define("EXPO_MODULES_CORE_VERSION", to: packageVersion))
        } else {
            fatalError("Could not find version for target: \(name)")
        }

        // Define RCT_NEW_ARCH_ENABLED for Fabric support - required when building xcframeworks
        cSettings.append(.define("RCT_NEW_ARCH_ENABLED", to: "1"))
        cxxSettings.append(.define("RCT_NEW_ARCH_ENABLED", to: "1"))

        // Enable C++ and Clang modules
        cSettings.append(.unsafeFlags(["-fcxx-modules", "-fmodules"]))
        cxxSettings.append(.unsafeFlags(["-fcxx-modules", "-fmodules"]))

        // Enable C++ interop for Objective-C targets that depend on React Native C++ headers
        cSettings.append(.unsafeFlags(["-x", "objective-c++"]))

        // Create and return the target
        // Note: SPM only supports a single publicHeadersPath, so we use the first one
        // Raise exception if includeDirectories contains more than one path
        if includeDirectories.count > 1 {
            fatalError(
                "ObjCTarget '\(name)' has multiple include directories. "
                    + "SPM only supports a single publicHeadersPath."
            )
        }
        let publicHeadersPath = includeDirectories.first ?? "include"

        // Add linked frameworks in the linker settings
        var linkerSettings: [LinkerSetting] = []
        for linkedFramework in linkedFrameworks {
            linkerSettings.append(.linkedFramework(linkedFramework))
        }

        // Convert plugin names to Target.PluginUsage
        let pluginUsages: [Target.PluginUsage]? =
            plugins.isEmpty ? nil : plugins.map { .plugin(name: $0) }

        return .target(
            name: name,
            dependencies: targetDependencies,
            path: path,
            publicHeadersPath: publicHeadersPath,
            cSettings: cSettings,
            cxxSettings: cxxSettings,
            linkerSettings: linkerSettings,
            plugins: pluginUsages
        )
    }
}

// MARK: - CPPTarget Class

class CPPTarget: ObjCTarget {
    convenience init(
        name: String, dependencies: [String], path: String, exclude: [String] = [],
        includeDirectories: String
    ) {
        self.init(
            name: name, dependencies: dependencies, path: path, exclude: exclude,
            includeDirectories: [includeDirectories]
        )
    }

    convenience init(
        name: String, dependencies: [String], path: String, exclude: [String] = [],
        includeDirectories: String,
        useIncludesFrom: [String]
    ) {
        self.init(
            name: name, dependencies: dependencies, path: path, exclude: exclude,
            includeDirectories: [includeDirectories], useIncludesFrom: useIncludesFrom
        )
    }

    override init(
        name: String, dependencies: [String], path: String, exclude: [String] = [],
        includeDirectories: [String] = ["include"],
        useIncludesFrom: [String] = [],
        linkedFrameworks: [String] = [],
        plugins: [String] = [],
        vfsOverlayPath: String? = nil
    ) {
        super.init(
            name: name, dependencies: dependencies, path: path, exclude: exclude,
            includeDirectories: includeDirectories, useIncludesFrom: useIncludesFrom,
            linkedFrameworks: linkedFrameworks, plugins: plugins, vfsOverlayPath: vfsOverlayPath)
    }
}
