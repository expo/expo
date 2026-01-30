# iOS Precompiled Modules System - Claude Instructions

You are helping with the Expo iOS precompiled modules system. This document provides a complete understanding of how the system works, enabling you to add SPM prebuild support to Expo packages.

## System Overview

The precompiled modules system allows Expo packages to be distributed as prebuilt XCFrameworks instead of source code. This dramatically improves build times for end users.

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILD TIME (CI/Release)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   spm.config.json  ──►  SPMPackage.ts  ──►  Package.swift  ──►  xcodebuild │
│                         (generates)         (SPM manifest)      (compiles)  │
│                                                    │                        │
│                                                    ▼                        │
│                                            .xcframeworks/                   │
│                                            └── debug/                       │
│                                                └── PackageName.xcframework  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Published to CDN/npm
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INSTALL TIME (User's App)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   pod install  ──►  PackagesConfig.rb  ──►  precompiled_modules.rb         │
│                     (checks for XCF)        (configures pods)               │
│                            │                                                │
│                            ▼                                                │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │ If XCFramework exists:           │ If NOT:                       │     │
│   │   - Link binary framework        │   - Compile from source       │     │
│   │   - Skip source compilation      │   - Normal pod behavior       │     │
│   │   - Configure header paths       │                               │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `spm.config.json` | Package root | Defines SPM targets, sources, dependencies |
| `SPMPackage.ts` | `tools/src/prebuilds/` | Generates Package.swift from config |
| `Package.ts` | `tools/src/prebuilds/` | Expo package discovery and metadata |
| `ExternalPackage.ts` | `tools/src/prebuilds/` | External (npm) package support |
| `precompiled_modules.rb` | `packages/expo-modules-autolinking/scripts/ios/` | Runtime CocoaPods integration |
| `PackagesConfig.rb` | Same directory | Package configuration and linking |

## Adding SPM Prebuild Support to Expo Packages

### Eligibility Requirements

✅ **Required:**
- iOS-compatible package with a `.podspec` file
- Uses `expo-modules-core` (ExpoModulesCore dependency)
- Only depends on supported external dependencies

❌ **Do NOT add SPM support if:**
- Package has complex third-party native dependencies
- Package doesn't use expo-modules-core
- Package requires custom build scripts or preprocessing

### Supported External Dependencies

| Dependency | Description |
|------------|-------------|
| `Hermes` | Hermes JavaScript engine XCFramework |
| `React` | React Native framework with headers |
| `ReactNativeDependencies` | React Native core dependencies |
| `expo-modules-core/ExpoModulesCore` | Expo modules core (for other packages) |

---

## Step-by-Step: Adding SPM Support

### Step 1: Analyze the Package

```bash
# Check the package structure
ls -la packages/<package-name>/ios/

# Look for source file types
find packages/<package-name>/ios -name "*.swift" -o -name "*.m" -o -name "*.mm" -o -name "*.cpp" -o -name "*.h"

# Check the podspec for dependencies and frameworks
cat packages/<package-name>/ios/*.podspec
```

### Step 2: Create spm.config.json

Create `packages/<package-name>/spm.config.json`:

#### Simple Swift-Only Package

```json
{
    "$schema": "../../tools/src/prebuilds/schemas/spm.config.schema.json",
    "products": [
        {
            "name": "PackageName",
            "platforms": ["iOS(.v15)"],
            "externalDependencies": [
                "ReactNativeDependencies",
                "React",
                "Hermes",
                "expo-modules-core/ExpoModulesCore"
            ],
            "targets": [
                {
                    "type": "swift",
                    "name": "PackageName",
                    "path": "ios",
                    "pattern": "*.swift",
                    "dependencies": [
                        "Hermes",
                        "React",
                        "ReactNativeDependencies",
                        "expo-modules-core/ExpoModulesCore"
                    ],
                    "linkedFrameworks": ["Foundation", "UIKit"]
                }
            ]
        }
    ]
}
```

#### Mixed Swift + ObjC Package

```json
{
    "products": [{
        "name": "PackageName",
        "platforms": ["iOS(.v15)"],
        "externalDependencies": ["ReactNativeDependencies", "React", "Hermes", "expo-modules-core/ExpoModulesCore"],
        "targets": [
            {
                "type": "objc",
                "name": "PackageName_ios_objc",
                "moduleName": "PackageName",
                "path": "ios",
                "pattern": "**/*.{m,mm}",
                "headerPattern": "**/*.h",
                "dependencies": ["Hermes", "React", "ReactNativeDependencies"],
                "linkedFrameworks": ["Foundation"],
                "includeDirectories": ["."]
            },
            {
                "type": "swift",
                "name": "PackageName",
                "path": "ios",
                "pattern": "**/*.swift",
                "dependencies": [
                    "Hermes", "React", "ReactNativeDependencies",
                    "expo-modules-core/ExpoModulesCore",
                    "PackageName_ios_objc"
                ],
                "linkedFrameworks": ["Foundation", "UIKit"]
            }
        ]
    }]
}
```

### Step 3: Modify the Podspec

Update `ios/PackageName.podspec`:

**Before:**
```ruby
Pod::Spec.new do |s|
  # ... metadata ...
  s.dependency 'ExpoModulesCore'
  s.static_framework = true
  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
```

**After:**
```ruby
Pod::Spec.new do |s|
  # ... metadata ...
  s.dependency 'ExpoModulesCore'

  if (!Expo::PackagesConfig.instance.try_link_with_prebuilt_xcframework(s))
    s.static_framework = true
    s.source_files = "**/*.{h,m,swift}"
    s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  end
end
```

### Step 4: Build and Verify

```bash
# Full pipeline
et prebuild-packages --build-flavor Debug --react-native-tarball-path <path> <package-name>

# Or step by step:
et prebuild-packages --build-flavor Debug --react-native-tarball-path <path> --generate <package-name>
et prebuild-packages --build-flavor Debug --react-native-tarball-path <path> --build <package-name>
et prebuild-packages --build-flavor Debug --react-native-tarball-path <path> --verify <package-name>
```

---

## Dependency Cache

The prebuild system uses a centralized versioned cache for React Native dependencies (Hermes, ReactNativeDependencies, React). This avoids downloading and copying dependencies for each package.

### Cache Location

```
packages/precompile/.cache/
├── hermes/
│   └── 0.76.0-Debug/           # <version>-<flavor>
│       └── Hermes.xcframework/
├── react-native-dependencies/
│   └── 0.76.7-Debug/
│       ├── ReactNativeDependencies.xcframework/
│       └── ...
└── react/
    └── 0.76.7-Debug/
        ├── React.xcframework/
        └── React-VFS.yaml
```

### Environment Variable

You can override the cache location with `EXPO_PREBUILD_CACHE_PATH`:

```bash
EXPO_PREBUILD_CACHE_PATH=/custom/cache/path et prebuild-packages ...
```

### Cache Management Options

| Flag | Effect |
|------|--------|
| `--clean-cache` | Wipes entire dependency cache (forces re-download) |
| `--prune-cache` | Removes old cache versions, keeps current version |
| `--clean-all` | Cleans package outputs only (xcframeworks, generated code, build folders) - does NOT touch cache |
| `--clean-build` | Cleans just the `.build/` folders |
| `--clean-generated` | Cleans just the generated source code |

Example - free up disk space by removing old versions:
```bash
et prebuild-packages --build-flavor Debug --prune-cache <package-name>
```

### Local Tarball Caching

When using `--react-native-tarball-path` (or similar) with a local tarball, the system tracks the tarball's modification time. If you run the command again with the same tarball, it will skip extraction and use the cached version. When you rebuild the tarball, it will automatically detect the change and re-extract.

---

## spm.config.json Schema Reference

### Target Types

#### Swift Target
```json
{
    "type": "swift",
    "name": "TargetName",
    "path": "ios",
    "pattern": "*.swift",
    "exclude": ["Tests/**"],
    "dependencies": ["expo-modules-core/ExpoModulesCore"],
    "linkedFrameworks": ["Foundation", "UIKit"]
}
```

#### Objective-C Target
```json
{
    "type": "objc",
    "name": "PackageName_ios_objc",
    "moduleName": "PackageName",
    "path": "ios",
    "pattern": "**/*.{m,mm}",
    "headerPattern": "**/*.h",
    "dependencies": ["Hermes", "React", "ReactNativeDependencies"],
    "linkedFrameworks": ["Foundation"],
    "includeDirectories": ["."]
}
```

#### C++ Target
```json
{
    "type": "cpp",
    "name": "PackageName_common_cpp",
    "moduleName": "PackageNameJSI",
    "path": "common/cpp",
    "pattern": "**/*.cpp",
    "headerPattern": "**/*.h",
    "dependencies": ["React", "ReactNativeDependencies"],
    "includeDirectories": ["."]
}
```

### Target Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `swift`, `objc`, or `cpp` |
| `name` | string | Target name (required) |
| `moduleName` | string | Module name for headers (defaults to product name) |
| `path` | string | Source path relative to package root |
| `pattern` | string | Glob pattern for source files |
| `headerPattern` | string | Glob pattern for header files (objc/cpp only) |
| `exclude` | array | Paths to exclude from sources |
| `dependencies` | array | Target dependencies |
| `linkedFrameworks` | array | System frameworks to link |
| `includeDirectories` | array | Header search paths (objc/cpp only) |

---

## Complex Multi-Target Packages

For packages with mixed Swift, Objective-C, and C++ code:

### Key Rules

1. **Swift cannot directly import C++ targets** - Use ObjC as a bridge
2. **Dependency chain**: C++ → ObjC → Swift
3. **Target naming**: Use suffixes like `_common_cpp`, `_ios_objc`

### Dependency Flow

```
┌─────────────────────┐
│  C++ Target         │  (common/cpp code)
│  PackageName_cpp    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ObjC Target        │  (bridges C++ to Swift)
│  PackageName_objc   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Swift Target       │  (main module)
│  PackageName        │
└─────────────────────┘
```

### Reference: expo-modules-core (5 targets)

See `packages/expo-modules-core/spm.config.json` for a complete example of a complex multi-target package with:
- 2 C++ targets (JSI and Core)
- 2 ObjC targets (JSI bridge and Core bridge)
- 1 Swift target (main module)

---

## Ruby Integration (CocoaPods)

### How precompiled_modules.rb Works

The Ruby code in `packages/expo-modules-core/ios/ReactDelegates/PrecompiledModules/` handles:

1. **Detection**: `enabled?` checks if precompiled modules are enabled via environment
2. **Linking**: `try_link_with_prebuilt_xcframework` switches a pod from source to binary
3. **Header Paths**: `configure_header_search_paths` ensures headers are found
4. **Codegen Exclusion**: `configure_codegen_for_prebuilt_modules` excludes prebuilt modules from ReactCodegen

### Key Methods

```ruby
# Check if precompiled modules are enabled
PrecompiledModules.enabled?

# Link a pod with its prebuilt XCFramework (returns true if successful)
PackagesConfig.instance.try_link_with_prebuilt_xcframework(spec)

# Configure header search paths for all prebuilt modules
PrecompiledModules.configure_header_search_paths(installer)

# Exclude prebuilt codegen modules from ReactCodegen
PrecompiledModules.configure_codegen_for_prebuilt_modules(installer)
```

### Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `EXPO_PRECOMPILED_MODULES` | `0`, `1` | Enable/disable precompiled modules |
| `EXPO_PRECOMPILED_MODULES_BUILD_FLAVOR` | `debug`, `release` | Which XCFramework flavor to use |

---

## Output Structure

After building, your package will have:

```
packages/<package-name>/
├── spm.config.json           # Your config
├── .build/                    # Build artifacts (gitignored)
│   ├── source/<ProductName>/
│   │   ├── Package.swift      # Generated SPM manifest
│   │   └── <TargetName>/      # Symlinked sources
│   └── frameworks/            # Build outputs
├── .xcframeworks/             # Final XCFrameworks (gitignored)
│   └── debug/
│       └── <ProductName>.xcframework/
└── .dependencies/             # Downloaded dependencies (gitignored)
```

---

## CLI Reference

### Command: `et prebuild-packages`

```bash
et prebuild-packages [options] <package-names...>
```

### Required Options

| Flag | Description |
|------|-------------|
| `--build-flavor <flavor>` | `Debug` or `Release` |
| `--react-native-tarball-path <path>` | Path to React Native XCFramework tarball |

### Pipeline Steps

| Flag | Description |
|------|-------------|
| `--download` | Download dependencies only |
| `--generate` | Generate Package.swift |
| `--build` | Build with xcodebuild |
| `--compose` | Create XCFrameworks |
| `--verify` | Validate frameworks |

---

## Troubleshooting

### Duplicate filename errors
SPM doesn't allow two files with the same name. Use `*.swift` (non-recursive) or rename files.

### Build fails with missing headers
- Check `includeDirectories` paths
- Verify `headerPattern` captures all headers
- Order dependencies correctly (dependencies before dependents)

### Swift can't find ObjC symbols
- Add ObjC target to Swift target's `dependencies`
- Verify ObjC target's `moduleName`

### Verification fails
- Inspect generated Package.swift: `.build/source/<ProductName>/Package.swift`
- Ensure glob patterns match all source files

---

## Code References

Examine these files for implementation details:

- `tools/src/prebuilds/SPMPackage.ts` - Package.swift generation
- `tools/src/prebuilds/Package.ts` - Expo package discovery
- `tools/src/prebuilds/ExternalPackage.ts` - External package support
- `tools/src/prebuilds/Codegen.ts` - Codegen handling
- `packages/expo-modules-autolinking/scripts/ios/precompiled_modules.rb` - CocoaPods integration
- `packages/expo-modules-autolinking/scripts/ios/packages_config.rb` - Package configuration
- `packages/expo-modules-core/spm.config.json` - Complex multi-target example
- `packages/expo-font/spm.config.json` - Simple Swift-only example
