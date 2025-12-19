# Expo Prebuilds System

The Expo Prebuilds System is a toolchain for building iOS XCFrameworks from Expo modules using Swift Package Manager (SPM). It automates the process of analyzing dependencies, generating `Package.swift` files, downloading dependencies, building frameworks for multiple platforms, and composing universal XCFrameworks.

## Overview

The prebuild system compiles Expo modules into prebuilt binary frameworks (XCFrameworks), which can speed up build times and simplify dependency management. The system supports:

- **Dependency Analysis**: Analyzes ObjC/Swift/C++ source files to automatically detect dependencies and suggest optimal SPM target structure
- Building for multiple platforms (iOS, iOS Simulator, macOS, tvOS, Mac Catalyst)
- Both Debug and Release configurations
- Automatic dependency resolution (Hermes, React Native, React Native Dependencies)
- Downloading artifacts from Maven repositories or using local tarballs
- Source code structure generation with symlinks (preserves original file locations)
- Module map and umbrella header generation
- **Multi-product support**: Split a single codebase into multiple products (e.g., ExpoModulesCore and ExpoModulesJSI)

## Architecture

### Core Components

| File | Description |
|------|-------------|
| `index.ts` | Public exports for the Prebuilder pipeline |
| `SPMAnalyzer.ts` | **Analyzes source files to detect dependencies and generate SPM configuration** |
| `SPMGenerator.ts` | Generates `Package.swift` files and source code structure |
| `SPMBuild.ts` | Builds Swift packages using `xcodebuild` |
| `Artifacts.ts` | Downloads prebuilt artifacts from Maven or nightly builds |
| `Artifacts.types.ts` | Type definitions for artifact configuration |
| `Dependencies.ts` | Manages downloading and copying of build dependencies |
| `Frameworks.ts` | Composes XCFrameworks from built framework slices |
| `XCodeRunner.ts` | Wrapper for running `xcodebuild` with formatted output |
| `Utils.ts` | Utility functions for version resolution and validation |
| `Prebuilder.types.ts` | Shared type definitions (BuildFlavor, etc.) |
| `SPMConfig.types.ts` | Type definitions for SPM configuration |
| `SPMBuild.types.ts` | Type definitions for build artifacts |

### Directory Structure

```
prebuilds/
├── schemas/
│   └── spm-config.schema.json  # JSON Schema for spm.config.json
├── templates/
│   ├── Package.template.swift           # Base Package.swift template
│   ├── hermes.template.swift            # Hermes dependency template
│   ├── react.template.swift             # React dependency template
│   └── reactNativeDependencies.template.swift
└── *.ts                                 # Core implementation files
```

## Dependency Analyzer

The dependency analyzer (`SPMAnalyzer.ts`) is a powerful tool that analyzes iOS/macOS source code to automatically detect dependencies between files and suggest optimal SPM target structures. It's particularly useful for:

- **Breaking down large codebases** into smaller, buildable SPM targets
- **Detecting cyclic dependencies** that would prevent compilation
- **Generating spm.config.json** files automatically
- **Supporting multi-product packages** (e.g., splitting into ExpoModulesCore and ExpoModulesJSI)

### Usage

The analyzer is invoked through the `et` CLI:

```bash
# Basic analysis
et analyze-deps packages/expo-modules-core/ios

# Analyze with multiple source directories
et analyze-deps packages/expo-modules-core/ios \
  -S packages/expo-modules-core/common

# Generate spm.config.json with SCC-based target grouping
et analyze-deps packages/expo-modules-core/ios \
  --virtual-targets --virtual-targets-scc \
  --external-deps ReactNativeDependencies,React,Hermes \
  --output-spm-config packages/expo-modules-core/spm.config.json

# Multi-product configuration (split into multiple products)
et analyze-deps packages/expo-modules-core/ios \
  -S packages/expo-modules-core/common \
  --virtual-targets --virtual-targets-scc \
  --external-deps ReactNativeDependencies,React,Hermes \
  --product "ExpoModulesJSI:JSI" \
  --product "ExpoModulesCore:*" \
  --output-spm-config packages/expo-modules-core/spm.config.json \
  --auto-bridge
```

### Analyzer Options

| Option | Description |
|--------|-------------|
| `-e, --exclude <patterns>` | Comma-separated directories/files to exclude (e.g., `Tests,Mocks`) |
| `-I, --include-path <paths>` | Additional include paths for clang analysis |
| `-S, --source-dir <path>` | Additional source directory to analyze (can be repeated) |
| `--output-json <path>` | Export analysis results to JSON |
| `--output-dot <path>` | Export dependency graph in DOT format (for Graphviz) |
| `--output-spm-config <path>` | Export as spm.config.json |
| `--external-deps <deps>` | Comma-separated external SPM dependencies |
| `--product <definition>` | Define a product: `"ProductName:path1,path2,..."`. Use `*` for catch-all |
| `--folder-targets` | Print folder-based target structure |
| `--virtual-targets` | Generate virtual targets from folder structure |
| `--virtual-targets-scc` | Use SCC (Strongly Connected Components) algorithm for grouping |
| `--no-virtual-targets-scc-merge-singletons` | Disable merging of single-file targets |
| `--virtual-targets-max-depth <n>` | Maximum folder depth for splitting (default: 4) |
| `--auto-bridge` | Automatically create bridging targets to break cycles |
| `--consolidate-swift` | Consolidate Swift into layered targets |
| `-v, --verbose` | Enable verbose logging |
| `--use-clang` | Use clang -MM for accurate dependency resolution |

### How It Works

1. **File Discovery**: Scans source directories for `.swift`, `.m`, `.mm`, `.c`, `.cpp`, and `.h` files

2. **Import Parsing**: Parses each file to extract:
   - `#import "..."` and `#import <...>` statements
   - `#include "..."` and `#include <...>` statements
   - Swift `import` statements
   - Framework imports (e.g., `Foundation`, `UIKit`)

3. **Dependency Graph**: Builds a directed graph of file dependencies

4. **Cycle Detection**: Uses Tarjan's SCC algorithm to find strongly connected components (cyclic dependencies)

5. **Target Generation**: Groups files into targets based on:
   - Folder structure
   - Language (Swift vs ObjC/C++)
   - Product assignment (for multi-product packages)
   - Dependency relationships

6. **Cross-Product Dependencies**: Automatically detects angle-bracket imports like `<ExpoModulesJSI/JSIUtils.h>` and adds the appropriate target dependencies

### Multi-Product Support

The analyzer supports splitting a codebase into multiple products. This is useful when:
- You want to ship parts of your code as separate frameworks
- Different parts have different dependencies
- You want to reduce binary size by allowing consumers to import only what they need

**Product Definition Format**: `"ProductName:pathPattern1,pathPattern2,..."`

- Path patterns match against file paths
- Use `*` as a catch-all for remaining files
- Products are processed in order; first match wins

**Example**:
```bash
--product "ExpoModulesJSI:JSI" \
--product "ExpoModulesCore:*"
```

This assigns:
- Files containing `JSI` in their path → `ExpoModulesJSI` product
- All other files → `ExpoModulesCore` product

### SCC Algorithm

The SCC (Strongly Connected Components) algorithm is used to:
1. Identify groups of files that have circular dependencies
2. Group these files into a single target (since they can't be separated)
3. Create a DAG (Directed Acyclic Graph) of targets

When combined with `--auto-bridge`, the analyzer can automatically create bridging/header-only targets to break cycles when possible.

### Output Formats

**JSON** (`--output-json`): Complete analysis data including files, imports, cycles, and suggested targets.

**DOT** (`--output-dot`): Graph visualization format. View with:
```bash
dot -Tpng output.dot -o graph.png
```

**SPM Config** (`--output-spm-config`): Ready-to-use `spm.config.json` file with:
- Target definitions with correct dependencies
- Product groupings
- External dependencies
- Linked system frameworks (Foundation is automatically added for Swift targets)

## Configuration

Each Expo module that supports prebuilding must have an `spm.config.json` file in its package directory. This file defines the SPM structure for the module.

See `prebuilds/schemas/spm.config.schema.json` for the full JSON schema.

### spm.config.json Structure

```json
{
  "$schema": "https://expo.dev/schemas/spm.config.json",
  "platforms": ["iOS(.v15)", "macOS(.v11)"],
  "externalDependencies": ["Hermes", "ReactNativeDependencies", "React"],
  "targets": [
    {
      "type": "objc",
      "name": "TargetName",
      "path": "ios/SourcePath",
      "dependencies": ["OtherTarget"],
      "exclude": ["**/Tests/**"],
      "includeDirectories": ["include"],
      "useIncludesFrom": ["AnotherTarget"],
      "linkedFrameworks": ["Foundation", "UIKit"],
      "plugins": []
    }
  ],
  "products": [
    {
      "name": "ExpoModuleName",
      "targets": ["TargetName", "OtherTarget"]
    }
  ]
}
```

### Supported Platforms

- `iOS(.v15)` - iOS 15+
- `macOS(.v11)` - macOS 11+
- `tvOS(.v15)` - tvOS 15+
- `macCatalyst(.v15)` - Mac Catalyst 15+

### Target Types

The system supports four target types:

1. **`objc`** - Objective-C source targets (`.m`, `.mm`, `.c`, `.cpp` files)
2. **`swift`** - Swift source targets (`.swift` files)
3. **`cpp`** - C++ source targets (`.cpp`, `.c`, `.cc`, `.cxx` files)
4. **`framework`** - Pre-built binary XCFramework targets

### Target Options

Common options available for source targets:

| Option | Description |
|--------|-------------|
| `name` | Target name (required) |
| `path` | Path to source files relative to package root (required) |
| `dependencies` | Names of other targets this target depends on |
| `exclude` | Glob patterns for files to exclude from compilation |
| `includeDirectories` | Header search paths relative to the target path |
| `useIncludesFrom` | Names of other targets to include headers from (header-only dependency) |
| `linkedFrameworks` | System frameworks to link (e.g., `Foundation`, `UIKit`) |
| `plugins` | SPM plugins to use for this target |

Framework targets also support:
- `headerMapPath` - Path to a header map file (`.hmap`)
- `vfsOverlayPath` - Path to a VFS overlay file (`.yaml`)

### External Dependencies

Packages can depend on these external dependencies:
- `Hermes` - The Hermes JavaScript engine
- `ReactNativeDependencies` - React Native core dependencies
- `React` - React Native framework

## Build Pipeline

The prebuild process consists of four stages that can be run individually or together:

### 1. Artifact Download (`--artifacts`)

Downloads required dependencies from Maven repositories or uses local tarballs:
- Hermes XCFramework
- React Native Dependencies XCFramework
- React XCFramework

Artifacts are cached by version in a shared folder, so subsequent builds reuse downloaded dependencies. Debug and Release artifacts are stored separately.

### 2. Package.swift Generation (`--generate`)

Generates the SPM build structure from `spm.config.json`:
- Creates a temporary source folder structure in `.build/source/`
- Generates `Package.swift` from templates
- Resolves external dependencies to their template definitions

**Why symlinks?** Swift Package Manager requires a specific directory layout where source files are organized by target. Rather than copying source files (which would duplicate them and break IDE navigation), the system creates symlinks from the SPM-required structure back to the original source locations. This allows:
- Building with SPM without reorganizing the existing codebase
- Keeping source files in their original locations for editing
- IDE features (go-to-definition, etc.) continue to work normally
- Header files are copied (not symlinked) since they need to be bundled in the final XCFramework

### 3. Build (`--build`)

Builds the Swift package for each platform using `xcodebuild`:
- Builds for all platforms defined in `spm.config.json`
- Produces `.framework` files for each platform slice
- Generates dSYM debug symbol bundles

### 4. XCFramework Composition (`--compose`)

Combines platform-specific frameworks into universal XCFrameworks:
- Merges framework slices using `xcodebuild -create-xcframework`
- Collects and flattens header files into each slice
- Generates module maps and umbrella headers

## Usage

### Command Line

The prebuild system is invoked through the `et` (expotools) CLI:

```bash
# Run all steps (artifacts, generate, build, compose)
et prebuild-packages --hermes-version 0.14.0 expo-modules-core

# Run specific steps
et prebuild-packages --hermes-version 0.14.0 --generate --build expo-modules-core

# Build with local tarballs (useful for testing local changes)
et prebuild-packages \
  --hermes-version 0.14.0 \
  --build-flavor Debug \
  --react-native-tarball-path "/path/to/React.xcframework.tar.gz" \
  --generate --build --compose \
  expo-modules-core

# Build for Release
et prebuild-packages --hermes-version 0.14.0 --build-flavor Release expo-modules-core

# Build a specific product from a multi-product package
et prebuild-packages --hermes-version 0.14.0 --product-name ExpoModulesCore expo-modules-core

# Build for a specific platform only
et prebuild-packages --hermes-version 0.14.0 --platform iOS expo-modules-core
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--hermes-version <version>` | Hermes version (required) |
| `--build-flavor <flavor>` | Build flavor: `Debug` (default) or `Release` |
| `--react-native-tarball-path <path>` | Local React Native tarball path |
| `--hermes-tarball-path <path>` | Local Hermes tarball path |
| `--react-native-dependencies-tarball-path <path>` | Local React Native Dependencies tarball path |
| `--artifacts` | Only download artifacts |
| `--generate` | Only generate Package.swift and source structure |
| `--build` | Only build Swift packages |
| `--compose` | Only compose XCFrameworks |
| `--platform <platform>` | Build for specific platform only |
| `--product-name <name>` | Build specific product from multi-product package |
| `--clean-artifacts` | Clear artifacts folder before downloading |
| `--clean-dependencies` | Clear package dependencies folder |
| `--clean-build` | Clear build folder before building |
| `--clean-generated` | Clear generated source folder before generating |

**Note:** If no step flags (`--artifacts`, `--generate`, `--build`, `--compose`) are provided, all steps are executed.

### Build Flavors

- **Debug** - Includes debug symbols (`DEBUG_INFORMATION_FORMAT=dwarf-with-dsym`)
- **Release** - Optimized for production

### Build Platforms

Each platform defined in `spm.config.json` expands to specific build destinations:

| Platform Config | Build Destinations |
|-----------------|-------------------|
| `iOS(.v15)` | `iOS`, `iOS Simulator` |
| `macOS(.v11)` | `macOS` |
| `tvOS(.v15)` | `tvOS`, `tvOS Simulator` |
| `macCatalyst(.v15)` | `macOS,variant=Mac Catalyst` |

## Output

The build process produces the following in the package directory:

```
package-name/
├── .build/
│   ├── source/           # Generated SPM source structure (symlinks)
│   └── frameworks/       # Intermediate build artifacts
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
├── Dependencies/         # Copied dependency XCFrameworks
└── Package.swift         # Generated SPM manifest
```

### XCFramework Contents

Each framework slice contains:
- Binary executable
- `Headers/` - All public headers (flattened)
- `Modules/module.modulemap` - Module map for Swift/Clang interop
- `ProductName_umbrella.h` - Umbrella header including all public headers

## Error Handling

The `XCodeRunner.ts` module provides formatted build output using `@expo/xcpretty`:

- **Interactive mode**: Spinner showing current build action
- **CI mode** (`CI=1`): Full formatted output without spinner
- **Verbose mode** (`EXPO_DEBUG=1`): Complete build output

Build failures display:
- Compilation errors with file locations
- Warnings
- Build summary

## Troubleshooting

### Common Issues

**Missing Hermes version:**
```
Hermes version is required. Check node_modules/react-native/sdks/.hermesversion
```
Solution: Provide `--hermes-version` flag with the correct version.

**Package not found:**
Ensure the package exists in the `packages/` directory and has an `spm.config.json` file.

**Build failures:**
Run with `EXPO_DEBUG=1` for verbose output to see detailed error messages.

### Debugging Tips

1. Use `--generate` only to inspect the generated `Package.swift` without building
2. Open the package folder in Xcode to debug SPM resolution issues
3. Check the `.build/` folder for intermediate build artifacts
4. Use local tarballs to test changes to dependencies

