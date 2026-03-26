# iOS Precompiled Modules System

This document provides a complete understanding of how the precompiled modules system works, enabling you to add SPM prebuild support to Expo packages.

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
│                                   packages/precompile/.build/<pkg>/output/  │
│                                   ├── debug/xcframeworks/<Product>.tar.gz   │
│                                   └── release/xcframeworks/<Product>.tar.gz │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Published to CDN/npm
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INSTALL TIME (pod install)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   autolinking_manager.rb  ──►  has_prebuilt_xcframework?()                 │
│   (registers pods)              │                                           │
│                                 ├─► YES: register with :podspec            │
│                                 │   (CocoaPods respects spec.source)       │
│                                 └─► NO:  register with :path              │
│                                     (compile from source as usual)          │
│                                                                             │
│   Podspec inline:  try_link_with_prebuilt_xcframework(spec)                │
│     - Sets spec.source = {:http => "file:///...tar.gz", :flatten => false} │
│     - Sets spec.vendored_frameworks                                        │
│     - Sets spec.prepare_command (copies flavor tarballs to artifacts/)     │
│     - Adds script phases for build-time switching                          │
│                                                                             │
│   Result in Pods/<PodName>/:                                               │
│     <Product>.xcframework/            (extracted by CocoaPods)             │
│     artifacts/<Product>-debug.tar.gz  (copied by prepare_command)          │
│     artifacts/<Product>-release.tar.gz                                     │
│     artifacts/.last_build_configuration                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        XCODE BUILD TIME                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Expo] Switch XCFramework script phase (always_out_of_date):             │
│     - Reads $GCC_PREPROCESSOR_DEFINITIONS for Debug/Release                │
│     - Checks artifacts/.last_build_configuration (fast-path)               │
│     - If changed: extracts correct flavor tarball via replace-xcframework  │
│                                                                             │
│   [Expo] Resolve dSYM source maps:                                         │
│     - Writes UUID plists into dSYMs for lldb source path remapping         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component                    | Location                                         | Purpose                                          |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `spm.config.json`            | Package root                                     | Defines SPM targets, sources, dependencies       |
| `SPMPackage.ts`              | `tools/src/prebuilds/`                           | Generates Package.swift from config              |
| `Package.ts`                 | `tools/src/prebuilds/`                           | Expo package discovery and metadata              |
| `ExternalPackage.ts`         | `tools/src/prebuilds/`                           | External (npm) package support                   |
| `precompiled_modules.rb`     | `packages/expo-modules-autolinking/scripts/ios/` | Pod install: source/vendored_frameworks/scripts  |
| `autolinking_manager.rb`     | Same directory                                   | Pod registration: :podspec vs :path switching    |
| `PackagesConfig.rb`          | Same directory                                   | Singleton delegate to PrecompiledModules         |
| `replace-xcframework.js`     | Same directory                                   | Build-time debug/release xcframework switching   |
| `resolve-dsym-sourcemaps.js` | Same directory                                   | Build-time dSYM source path remapping for lldb   |

### Supported Expo Modules

Each of these has an `spm.config.json` in its package root:

| Package | Product Name |
|---------|-------------|
| `expo-age-range` | `ExpoAgeRange` |
| `expo-app-integrity` | `ExpoAppIntegrity` |
| `expo-apple-authentication` | `ExpoAppleAuthentication` |
| `expo-application` | `EXApplication` |
| `expo-asset` | `ExpoAsset` |
| `expo-audio` | `ExpoAudio` |
| `expo-background-fetch` | `ExpoBackgroundFetch` |
| `expo-background-task` | `ExpoBackgroundTask` |
| `expo-battery` | `ExpoBattery` |
| `expo-blob` | `ExpoBlob` |
| `expo-blur` | `ExpoBlur` |
| `expo-brightness` | `ExpoBrightness` |
| `expo-brownfield` | `ExpoBrownfield` |
| `expo-calendar` | `ExpoCalendar` |
| `expo-cellular` | `ExpoCellular` |
| `expo-clipboard` | `ExpoClipboard` |
| `expo-contacts` | `ExpoContacts` |
| `expo-crypto` | `ExpoCrypto` |
| `expo-device` | `ExpoDevice` |
| `expo-document-picker` | `ExpoDocumentPicker` |
| `expo-eas-client` | `EASClient` |
| `expo-file-system` | `ExpoFileSystem` |
| `expo-font` | `ExpoFont` |
| `expo-glass-effect` | `ExpoGlassEffect` |
| `expo-haptics` | `ExpoHaptics` |
| `expo-image` | `ExpoImage` |
| `expo-image-picker` | `ExpoImagePicker` |
| `expo-json-utils` | `EXJSONUtils` |
| `expo-keep-awake` | `ExpoKeepAwake` |
| `expo-linear-gradient` | `ExpoLinearGradient` |
| `expo-linking` | `ExpoLinking` |
| `expo-live-photo` | `ExpoLivePhoto` |
| `expo-local-authentication` | `ExpoLocalAuthentication` |
| `expo-localization` | `ExpoLocalization` |
| `expo-location` | `ExpoLocation` |
| `expo-mail-composer` | `ExpoMailComposer` |
| `expo-manifests` | `EXManifests` |
| `expo-maps` | `ExpoMaps` |
| `expo-media-library` | `ExpoMediaLibrary` |
| `expo-mesh-gradient` | `ExpoMeshGradient` |
| `expo-modules-core` | `ExpoModulesCore` |
| `expo-network` | `ExpoNetwork` |
| `expo-notifications` | `ExpoNotifications` |
| `expo-print` | `ExpoPrint` |
| `expo-screen-capture` | `ExpoScreenCapture` |
| `expo-secure-store` | `ExpoSecureStore` |
| `expo-sensors` | `ExpoSensors` |
| `expo-sharing` | `ExpoSharing` |
| `expo-sms` | `ExpoSMS` |
| `expo-speech` | `ExpoSpeech` |
| `expo-splash-screen` | `ExpoSplashScreen` |
| `expo-sqlite` | `ExpoSQLite` |
| `expo-store-review` | `ExpoStoreReview` |
| `expo-structured-headers` | `EXStructuredHeaders` |
| `expo-symbols` | `ExpoSymbols` |
| `expo-system-ui` | `ExpoSystemUI` |
| `expo-tracking-transparency` | `ExpoTrackingTransparency` |
| `expo-ui` | `ExpoUI` |
| `expo-updates-interface` | `EXUpdatesInterface` |
| `expo-video` | `ExpoVideo` |
| `expo-video-thumbnails` | `ExpoVideoThumbnails` |
| `expo-web-browser` | `ExpoWebBrowser` |
| `expo-widgets` | `ExpoWidgets` |
| `unimodules-app-loader` | `UMAppLoader` |

For supported external (third-party) packages, see [`packages/external/README.md`](../../packages/external/README.md#supported-external-packages).

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

| Dependency                          | Description                            |
| ----------------------------------- | -------------------------------------- |
| `Hermes`                            | Hermes JavaScript engine XCFramework   |
| `React`                             | React Native framework with headers    |
| `ReactNativeDependencies`           | React Native core dependencies         |
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
      "podName": "PackageName",
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
  "products": [
    {
      "name": "PackageName",
      "podName": "PackageName",
      "platforms": ["iOS(.v15)"],
      "externalDependencies": [
        "ReactNativeDependencies",
        "React",
        "Hermes",
        "expo-modules-core/ExpoModulesCore"
      ],
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
            "Hermes",
            "React",
            "ReactNativeDependencies",
            "expo-modules-core/ExpoModulesCore",
            "PackageName_ios_objc"
          ],
          "linkedFrameworks": ["Foundation", "UIKit"]
        }
      ]
    }
  ]
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
# Full pipeline (all steps, Debug only)
et prebuild -f Debug --local-react-native-tarball <path> <package-name>

# Generate only (skip build, compose, verify):
et prebuild -f Debug --local-react-native-tarball <path> --skip-build --skip-compose --skip-verify <package-name>

# Verify only (skip other steps):
et prebuild -f Debug --local-react-native-tarball <path> --skip-generate --skip-artifacts --skip-build --skip-compose <package-name>
```

---

## Dependency Cache

The prebuild system uses a centralized versioned cache for React Native dependencies (Hermes, ReactNativeDependencies, React). This avoids downloading and copying dependencies for each package.

### Cache Location

```
packages/precompile/.cache/
├── hermes/
│   └── 0.76.0/
│       └── debug/              # <version>/<flavor>/
│           └── Hermes.xcframework/
├── react-native-dependencies/
│   └── 0.76.7/
│       └── debug/
│           ├── ReactNativeDependencies.xcframework/
│           └── ...
└── react/
    └── 0.76.7/
        └── debug/
            ├── React.xcframework/
            └── React-VFS.yaml
```

### Environment Variable

You can override the cache location with `EXPO_PREBUILD_CACHE_PATH`:

```bash
EXPO_PREBUILD_CACHE_PATH=/custom/cache/path et prebuild ...
```

### Cache Management Options

| Flag            | Effect                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| `--clean-cache` | Wipes entire dependency cache (forces re-download)                                          |
| `--clean`       | Cleans package outputs (xcframeworks, generated code, build folders) - does NOT touch cache |

Example - clean and rebuild:

```bash
et prebuild --clean -f Debug <package-name>
```

### Local Tarball Caching

When using `--local-react-native-tarball` (or similar) with a local tarball, the system tracks the tarball's modification time. If you run the command again with the same tarball, it will skip extraction and use the cached version. When you rebuild the tarball, it will automatically detect the change and re-extract.

The `{flavor}` placeholder is supported in tarball paths, allowing separate paths for Debug and Release:

```bash
et prebuild --local-react-native-tarball "/path/to/{flavor}/React.xcframework.tar.gz" <package-name>
```

---

## spm.config.json Schema Reference

### Target Options Reference

| Option               | Type            | Description                                        |
| -------------------- | --------------- | -------------------------------------------------- |
| `type`               | string          | `swift`, `objc`, or `cpp`                          |
| `name`               | string          | Target name (required)                             |
| `moduleName`         | string          | Module name for headers (defaults to product name) |
| `path`               | string          | Source path relative to package root               |
| `pattern`            | string          | Glob pattern for source files                      |
| `headerPattern`      | string          | Glob pattern for header files (objc/cpp only)      |
| `exclude`            | array           | Paths to exclude from sources                      |
| `dependencies`       | array           | Target dependencies                                |
| `linkedFrameworks`   | array           | System frameworks to link                          |
| `includeDirectories` | array           | Header search paths (objc/cpp only)                |
| `compilerFlags`      | array or object | Compiler flags (array for all builds, or object with `common`/`debug`/`release` keys). See [`packages/external/README.md` — Compiler Flags](../../packages/external/README.md#compiler-flags) for details |

### Product Options Reference

| Option                 | Type   | Description                                                                                     |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `name`                 | string | Product/XCFramework name (required)                                                             |
| `podName`              | string | CocoaPods pod name from podspec (required)                                                      |
| `codegenName`          | string | Codegen module name from `codegenConfig.name` in package.json (optional, for Fabric components) |
| `platforms`            | array  | SPM platforms, e.g., `["iOS(.v15)"]`                                                            |
| `externalDependencies` | array  | External package dependencies (React, Hermes, etc.)                                             |
| `targets`              | array  | Build targets for this product                                                                  |

---

## Complex Multi-Target Packages

For packages with mixed Swift, Objective-C, and C++ code:

### Key Rules

1. **Swift targets don't directly import C++ targets in this SPM setup** - Use ObjC as a bridge
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

The Ruby code in `packages/expo-modules-autolinking/scripts/ios/` handles all CocoaPods integration:

1. **Detection**: `enabled?` checks `EXPO_USE_PRECOMPILED_MODULES=1`
2. **Availability**: `has_prebuilt_xcframework?(pod_name)` checks if a tarball exists in build output
3. **Linking**: `try_link_with_prebuilt_xcframework(spec)` sets `spec.source`, `vendored_frameworks`, `prepare_command`, and script phases
4. **External pods**: `get_external_prebuilt_pods(project_dir)` discovers 3rd-party pods with prebuilt xcframeworks
5. **Cache management**: `clear_cocoapods_cache` removes stale CocoaPods cache entries
6. **Header Paths**: `configure_header_search_paths(installer)` ensures ExpoModulesJSI headers are found
7. **Codegen Exclusion**: `configure_codegen_for_prebuilt_modules(installer)` excludes prebuilt modules from ReactCodegen

### Pod Registration Flow

`autolinking_manager.rb` controls how pods are registered in the Podfile:

- **Internal Expo pods**: `has_prebuilt_xcframework?` → `:podspec` (CocoaPods respects `spec.source`) or `:path` (compile from source)
- **External 3rd-party pods**: Registered with `:podspec` in `use_expo_modules!` BEFORE RN CLI's `use_native_modules!` runs. RN CLI skips already-registered pods, so the `:podspec` registration takes precedence.
- **Podspec inline call**: `try_link_with_prebuilt_xcframework(spec)` sets `spec.source = {:http => "file:///...tar.gz", :flatten => false}`. CocoaPods downloads and extracts the tarball into `Pods/<PodName>/`.

### Environment Variables

| Variable                      | Values             | Description                            |
| ----------------------------- | ------------------ | -------------------------------------- |
| `EXPO_USE_PRECOMPILED_MODULES`| `0`, `1`           | Enable/disable precompiled modules     |
| `EXPO_PRECOMPILED_FLAVOR`     | `debug`, `release` | Which XCFramework flavor to use        |

---

## Output Structure

### Build Output

After building, tarballs are stored in the centralized build directory:

```
packages/precompile/.build/<package-name>/    # Build artifacts (gitignored)
├── generated/<ProductName>/
│   ├── Package.swift          # Generated SPM manifest
│   └── <TargetName>/          # Symlinked sources
├── output/
│   ├── debug/xcframeworks/
│   │   └── <ProductName>.tar.gz   # Debug flavor tarball (source of truth)
│   └── release/xcframeworks/
│       └── <ProductName>.tar.gz   # Release flavor tarball (source of truth)
└── codegen/                   # React Native codegen output
```

### After pod install (in Pods/)

When `EXPO_USE_PRECOMPILED_MODULES=1`, CocoaPods extracts tarballs into `Pods/<PodName>/`:

```
Pods/<PodName>/
├── <ProductName>.xcframework/       # Extracted by CocoaPods from spec.source tarball
│   ├── Info.plist
│   ├── ios-arm64/
│   │   ├── <ProductName>.framework/
│   │   └── dSYMs/
│   └── ios-arm64_x86_64-simulator/
│       ├── <ProductName>.framework/
│       └── dSYMs/
└── artifacts/                        # Copied by prepare_command
    ├── <ProductName>-debug.tar.gz
    ├── <ProductName>-release.tar.gz
    └── .last_build_configuration     # Tracks current flavor for incremental builds
```

Cleaning is simple: `rm -rf Pods` removes all precompiled state. Next `pod install` re-extracts everything.

---

## CLI Reference

### Command: `et prebuild`

```bash
et prebuild [options] <package-names...>
```

### Key Options

| Flag                                  | Description                                                               |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `-f, --flavor <flavor>`               | `Debug` or `Release` (default: both)                                      |
| `--local-react-native-tarball <path>` | Path to React Native XCFramework tarball. Supports `{flavor}` placeholder |

### Pipeline Steps (all run by default)

| Flag               | Description                   |
| ------------------ | ----------------------------- |
| `--skip-artifacts` | Skip downloading dependencies |
| `--skip-generate`  | Skip generating Package.swift |
| `--skip-build`     | Skip building with xcodebuild |
| `--skip-compose`   | Skip creating XCFrameworks    |
| `--skip-verify`    | Skip validating frameworks    |

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

- Inspect generated Package.swift: `packages/precompile/.build/<package-name>/generated/<ProductName>/Package.swift`
- Ensure glob patterns match all source files

---

## Known Limitations

- **ObjC + ExpoModulesCore**: Packages with ObjC code that imports `<ExpoModulesCore/...>` headers may fail with "non-modular header" errors due to ExpoModulesCore's transitive React Native header dependencies.
- **Category-only ObjC**: Pure ObjC packages that only define categories have no linkable symbols for dynamic frameworks.
- **Podspec pattern**: Always use `Expo::PackagesConfig.instance.try_link_with_prebuilt_xcframework(s)` pattern. Source compilation settings go inside the `if (!...)` block.
