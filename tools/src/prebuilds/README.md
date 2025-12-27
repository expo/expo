
# Expo Prebuilds System

The Expo Prebuilds System is a toolchain for building iOS XCFrameworks from Expo modules using Swift Package Manager (SPM). It automates the process of generating `Package.swift` files, downloading dependencies, building frameworks for multiple platforms, composing universal XCFrameworks, and verifying the resulting binaries.

## Overview

The prebuild system compiles Expo modules into prebuilt binary frameworks (XCFrameworks), which can speed up build times and simplify dependency management. The system supports:

- Building for multiple platforms (iOS, iOS Simulator, macOS, tvOS, Mac Catalyst, visionOS)
- Both Debug and Release configurations
- Automatic dependency resolution (Hermes, React Native, React Native Dependencies)
- Downloading artifacts from Maven repositories or using local tarballs
- Source code structure generation with symlinks (preserves original file locations)
- Module map and umbrella header generation
- Multi-product support: Split a single codebase into multiple products (e.g., ExpoModulesCore and ExpoModulesJSI)
- XCFramework verification: Validates built frameworks for correctness

## Architecture

### Core Components

| File | Description |
|------|-------------|
| `index.ts` | Public exports for the Prebuilder pipeline |
| `SPMPackage.ts` | **Generates clean, flat Package.swift files from SPM configuration** |
| `SPMGenerator.ts` | Generates source code structure with symlinks for SPM builds |
| `SPMBuild.ts` | Builds Swift packages using `xcodebuild` |
| `SPMVerify.ts` | **Verifies XCFramework correctness (headers, modules, binaries)** |
| `Artifacts.ts` | Downloads prebuilt artifacts from Maven or nightly builds |
| `Artifacts.types.ts` | Type definitions for artifact configuration |
| `Dependencies.ts` | Manages downloading and copying of build dependencies |
| `Frameworks.ts` | Composes XCFrameworks from built framework slices |
| `XCodeRunner.ts` | Wrapper for running `xcodebuild` with formatted output |
| `Utils.ts` | Utility functions for version resolution and validation |
| `Prebuilder.types.ts` | Shared type definitions (BuildFlavor, etc.) |
| `SPMConfig.types.ts` | Type definitions for SPM configuration |
| `SPMBuild.types.ts` | Type definitions for build artifacts |
| `SPMPackage.types.ts` | Type definitions for Package.swift generation |
| `SPMVerify.types.ts` | Type definitions for verification reports |

## Configuration

Each Expo module that supports prebuilding must have an `spm.config.json` file in its package directory. This file defines the SPM structure for the module.

See `prebuilds/schemas/spm.config.schema.json` for the full JSON schema.

### Supported Platforms

- \`iOS(.v15)\` - iOS 15+
- \`iOS(.v15_1)\` - iOS 15.1+
- \`macOS(.v11)\` - macOS 11+
- \`tvOS(.v15)\` - tvOS 15+
- \`tvOS(.v15_1)\` - tvOS 15.1+
- \`macCatalyst(.v15)\` - Mac Catalyst 15+

### Target Types

The system supports four target types:

1. **\`objc\`** - Objective-C source targets (\`.m\`, \`.mm\`, \`.c\`, \`.cpp\` files)
2. **\`swift\`** - Swift source targets (\`.swift\` files)
3. **\`cpp\`** - C++ source targets (\`.cpp\`, \`.c\`, \`.cc\`, \`.cxx\` files)
4. **\`framework\`** - Pre-built binary XCFramework targets

### Target Options

Common options available for all source targets (`objc`, `swift`, `cpp`):

| Option | Description |
|--------|-------------|
| `name` | Target name (required) |
| `moduleName` | Module name for header organization (defaults to product name) |
| `path` | Path to source files relative to package root (required) |
| `pattern` | Glob pattern to filter source files within the path |
| `headerPattern` | Glob pattern to filter header files within the path |
| `dependencies` | Names of other targets this target depends on |
| `exclude` | Glob patterns for files to exclude from compilation |
| `includeDirectories` | Header search paths relative to the target path |
| `linkedFrameworks` | System frameworks to link (e.g., `Foundation`, `UIKit`) |


Framework targets support:
- \`headerMapPath\` - Path to a header map file (\`.hmap\`)
- \`vfsOverlayPath\` - Path to a VFS overlay file (\`.yaml\`)

### External Dependencies

Packages can depend on these external dependencies:
- \`Hermes\` - The Hermes JavaScript engine (hermesvm.xcframework)
- \`ReactNativeDependencies\` - React Native core dependencies
- \`React\` - React Native framework (with header map and VFS overlay support)

## Build Pipeline

The prebuild process consists of five stages that can be run individually or together:

### 1. Artifact Download (\`--artifacts\`)

Downloads required dependencies from Maven repositories or uses local tarballs:
- Hermes XCFramework
- React Native Dependencies XCFramework
- React XCFramework

Artifacts are cached by version in a shared folder, so subsequent builds reuse downloaded dependencies. Debug and Release artifacts are stored separately in flavor-specific subfolders.

### 2. Package.swift Generation (\`--generate\`)

Generates the SPM build structure from \`spm.config.json\`:
- Creates a temporary source folder structure in \`.build/source/<ProductName>/\`
- Generates a clean, flat \`Package.swift\` without helper classes
- Resolves external dependencies to their XCFramework paths

**Why symlinks?** Swift Package Manager requires a specific directory layout where source files are organized by target. Rather than copying source files (which would duplicate them and break IDE navigation), the system creates symlinks from the SPM-required structure back to the original source locations. This allows:
- Building with SPM without reorganizing the existing codebase
- Keeping source files in their original locations for editing
- IDE features (go-to-definition, etc.) continue to work normally
- Header files are copied (not symlinked) since they need to be bundled in the final XCFramework

### 3. Build (\`--build\`)

Builds the Swift package for each platform using \`xcodebuild\`:
- Builds for all platforms defined in \`spm.config.json\`
- Produces \`.framework\` files for each platform slice
- Generates dSYM debug symbol bundles
- Uses C++20 language standard

### 4. XCFramework Composition (\`--compose\`)

Combines platform-specific frameworks into universal XCFrameworks:
- Merges framework slices using \`xcodebuild -create-xcframework\`
- Collects and flattens header files into each slice
- Generates module maps and umbrella headers

### 5. Verification (\`--verify\`)

Validates the built XCFrameworks for correctness:
- Verifies Info.plist validity
- Checks codesign status
- Scans for junk files (source files that shouldn't be in the framework)
- For each slice:
  - Validates Mach-O binary format
  - Checks linked dependencies
  - Verifies Headers directory presence
  - Verifies Modules directory and module.modulemap
  - Tests modular header compilation with clang
  - Typechecks Swift interface files with swift-frontend

## Usage

### Command Line

The prebuild system is invoked through the \`et\` (expotools) CLI:

\`\`\`bash
# Run all steps (artifacts, generate, build, compose, verify)
et prebuild-packages --hermes-version 0.14.0 expo-modules-core

# Run specific steps
et prebuild-packages --hermes-version 0.14.0 --generate --build expo-modules-core

# Build with local tarballs (useful for testing local changes)
et prebuild-packages \\
  --hermes-version 0.14.0 \\
  --build-flavor Debug \\
  --react-native-tarball-path "/path/to/React.xcframework.tar.gz" \\
  --generate --build --compose \\
  expo-modules-core

# Build for Release
et prebuild-packages --hermes-version 0.14.0 --build-flavor Release expo-modules-core

# Build a specific product from a multi-product package
et prebuild-packages --hermes-version 0.14.0 --product-name ExpoModulesCore expo-modules-core

# Build for a specific platform only
et prebuild-packages --hermes-version 0.14.0 --platform iOS expo-modules-core

# Verify only (skip build steps)
et prebuild-packages --hermes-version 0.14.0 --verify expo-modules-core

# Clean everything and rebuild
et prebuild-packages --hermes-version 0.14.0 --clean-all expo-modules-core
\`\`\`

### CLI Options

| Option | Description |
|--------|-------------|
| \`--hermes-version <version>\` | Hermes version (required) |
| \`--build-flavor <flavor>\` | Build flavor: \`Debug\` (default) or \`Release\` |
| \`--react-native-tarball-path <path>\` | Local React Native tarball path |
| \`--hermes-tarball-path <path>\` | Local Hermes tarball path |
| \`--react-native-dependencies-tarball-path <path>\` | Local React Native Dependencies tarball path |
| \`--artifacts\` | Only download artifacts |
| \`--generate\` | Only generate Package.swift and source structure |
| \`--build\` | Only build Swift packages |
| \`--compose\` | Only compose XCFrameworks |
| \`--verify\` | Verify built XCFrameworks |
| \`--platform <platform>\` | Build for specific platform only |
| \`--product-name <name>\` | Build specific product from multi-product package |
| \`--clean-artifacts\` | Clear artifacts folder before downloading |
| \`--clean-dependencies\` | Clear package dependencies folder |
| \`--clean-build\` | Clear build folder before building |
| \`--clean-generated\` | Clear generated source folder before generating |
| \`--clean-all\` | Clear all artifacts, dependencies, generated code, and build folders |

**Note:** If no step flags (\`--artifacts\`, \`--generate\`, \`--build\`, \`--compose\`, \`--verify\`) are provided, all steps are executed.

### Build Flavors

- **Debug** - Includes debug symbols (\`DEBUG_INFORMATION_FORMAT=dwarf-with-dsym\`)
- **Release** - Optimized for production

### Build Platforms

Each platform defined in \`spm.config.json\` expands to specific build destinations:

| Platform Config | Build Destinations |
|-----------------|-------------------|
| \`iOS(.v15)\` | \`iOS\`, \`iOS Simulator\` |
| \`macOS(.v11)\` | \`macOS\` |
| \`tvOS(.v15)\` | \`tvOS\`, \`tvOS Simulator\` |
| \`macCatalyst(.v15)\` | \`macOS,variant=Mac Catalyst\` |

## Output

The build process produces the following in the package directory:

\`\`\`
package-name/
├── .build/
│   ├── source/
│   │   └── <ProductName>/     # Generated SPM source structure per product
│   │       ├── Package.swift
│   │       └── <TargetName>/  # Symlinked source files
│   └── frameworks/            # Intermediate build artifacts
├── .xcframeworks/
│   └── debug|release/
│       └── ProductName.xcframework/
│           ├── Info.plist
│           ├── ios-arm64/
│           │   └── ProductName.framework/
│           │       ├── Headers/
│           │       ├── Modules/module.modulemap
│           │       └── ProductName (binary)
│           └── ios-arm64_x86_64-simulator/
│               └── ...
└── .dependencies/              # Copied dependency XCFrameworks
    ├── Hermes/
    ├── React-Core-prebuilt/
    └── ReactNativeDependencies/
\`\`\`

### XCFramework Contents

Each framework slice contains:
- Binary executable
- \`Headers/\` - All public headers (flattened)
- \`Modules/module.modulemap\` - Module map for Swift/Clang interop
- \`ProductName_umbrella.h\` - Umbrella header including all public headers

## XCFramework Verification

The \`SPMVerify\` module provides comprehensive verification of built XCFrameworks:

### Verification Checks

| Check | Description |
|-------|-------------|
| Info.plist | Validates the XCFramework's Info.plist is well-formed |
| Codesign | Verifies code signature (may fail for debug/local builds) |
| Junk Files | Scans for source files that shouldn't be in the framework |
| Mach-O Info | Validates binary format with `lipo`, `file`, and `otool` |
| Headers | Verifies Headers directory presence |
| Modules | Verifies Modules directory presence |
| Module Map | Checks for module.modulemap file |
| Modular Headers | Compiles headers with clang to verify modularity |
| Clang Module Import | Tests `@import ModuleName` with clang |
| Swift Interface | Typechecks .swiftinterface files with swift-frontend |

### Verification Output

The verification produces a detailed report for each slice:
- ✅ Success indicators for passing checks
- ⚠️ Warnings for non-critical issues
- ❌ Failures for critical problems
- Linked dependencies list
- Detailed error messages when checks fail

## Error Handling

The \`XCodeRunner.ts\` module provides formatted build output using \`@expo/xcpretty\`:

- **Interactive mode**: Spinner showing current build action
- **CI mode** (\`CI=1\`): Full formatted output without spinner
- **Verbose mode** (\`EXPO_DEBUG=1\`): Complete build output

Build failures display:
- Compilation errors with file locations
- Warnings
- Build summary

## Troubleshooting

### Common Issues

**Missing Hermes version:**
\`\`\`
Hermes version is required. Check node_modules/react-native/sdks/.hermesversion
\`\`\`
Solution: Provide \`--hermes-version\` flag with the correct version.

**Package not found:**
Ensure the package exists in the \`packages/\` directory and has an \`spm.config.json\` file.

**Build failures:**
Run with \`EXPO_DEBUG=1\` for verbose output to see detailed error messages.

**Artifacts not found:**
If you're using \`--build\` or \`--compose\` without \`--artifacts\`, ensure the artifacts have been previously downloaded or use \`--artifacts\` to download them first.

### Debugging Tips

1. Use `--generate` only to inspect the generated `Package.swift` without building
2. Open the `.build/source/<ProductName>/` folder in Xcode to debug SPM resolution issues
3. Check the `.build/frameworks/` folder for intermediate build artifacts
4. Use local tarballs (`--react-native-tarball-path`, etc.) to test changes to dependencies
5. Use `--verify` to validate built frameworks and identify issues
6. Use `--clean-all` to start fresh if you encounter strange build issues

