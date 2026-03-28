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
│   spm.config.json  ──►  SPMGenerator.ts  ──►  Package.swift  ──►  xcodebuild│
│                         (generates)          (SPM manifest)      (compiles) │
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
│   autolinking_manager.rb  ──►  pod_registration_options()                  │
│   (registers pods)              │                                           │
│                                 ├─► prebuilt: register with :podspec       │
│                                 │   (CocoaPods respects spec.source)       │
│                                 └─► source:   register with :path          │
│                                     (compile from source as usual)          │
│                                                                             │
│   sandbox.rb hook:  patch_spec_for_prebuilt(spec)  [auto-patching]        │
│     - Sets spec.source = {:http => "file:///...tar.gz", :flatten => false} │
│     - Sets spec.vendored_frameworks                                        │
│     - Strips bundled SPM dependencies                                      │
│     - Adds script phases for build-time switching                          │
│                                                                             │
│   Post-install:  perform_post_install(installer)                           │
│     - ensure_artifacts (copies flavor tarballs to Pods/<Pod>/artifacts/)   │
│     - configure_header_search_paths                                        │
│     - configure_codegen_for_prebuilt_modules                               │
│     - stub_bundled_pod_targets                                             │
│     - configure_use_frameworks (if use_frameworks! active)                 │
│                                                                             │
│   Result in Pods/<PodName>/:                                               │
│     <Product>.xcframework/            (extracted by CocoaPods)             │
│     artifacts/<Product>-debug.tar.gz  (copied by ensure_artifacts)        │
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

| Component                    | Location                                         | Purpose                                                     |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| `spm.config.json`            | Package root                                     | Defines SPM targets, sources, dependencies                  |
| `SPMGenerator.ts`            | `tools/src/prebuilds/`                           | Generates staged source layout and Package.swift             |
| `SPMPackage.ts`              | `tools/src/prebuilds/`                           | Generates flat Package.swift from SPM config                 |
| `SPMBuild.ts`                | `tools/src/prebuilds/`                           | Invokes xcodebuild to build package targets                  |
| `Frameworks.ts`              | `tools/src/prebuilds/`                           | Composes and post-processes XCFramework outputs              |
| `Verifier.ts`                | `tools/src/prebuilds/`                           | Validates built XCFrameworks with slice-level diagnostics    |
| `Dependencies.ts`            | `tools/src/prebuilds/`                           | Resolves and caches build dependencies (React, Hermes, RN)  |
| `ExternalPackage.ts`         | `tools/src/prebuilds/`                           | External (npm) package support                               |
| `pipeline/`                  | `tools/src/prebuilds/pipeline/`                  | Pipeline orchestration, scheduling, and step execution       |
| `precompiled_modules.rb`     | `packages/expo-modules-autolinking/scripts/ios/` | Pod install: spec patching, linking, post-install hooks      |
| `autolinking_manager.rb`     | Same directory                                   | Pod registration: :podspec vs :path switching                |
| `packages_config.rb`         | Same directory                                   | Singleton delegate to PrecompiledModules                     |
| `cocoapods/sandbox.rb`       | Same directory                                   | Auto-patches podspecs on-the-fly during pod install          |
| `cocoapods/installer.rb`     | Same directory                                   | Hooks into CocoaPods pre/post-install for precompiled config |
| `replace-xcframework.js`     | Same directory                                   | Build-time debug/release xcframework switching               |
| `resolve-dsym-sourcemaps.js` | Same directory                                   | Build-time dSYM source path remapping for lldb               |

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
| `expo-image-manipulator` | `ExpoImageManipulator` |
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

### Supported External (Third-Party) Packages

| Package | Product Name |
|---------|-------------|
| `@react-native-async-storage/async-storage` | `RNCAsyncStorage` |
| `@shopify/react-native-skia` | `RNSkia` |
| `react-native-reanimated` | `RNReanimated` |
| `react-native-safe-area-context` | `RNCSafeAreaContext` |
| `react-native-screens` | `RNScreens` |
| `react-native-svg` | `RNSVG` |
| `react-native-worklets` | `RNWorklets` |

For more details, see [`packages/expo-modules-autolinking/external-configs/ios/README.md`](../../packages/expo-modules-autolinking/external-configs/ios/README.md#supported-external-packages).

## Adding SPM Prebuild Support to Expo Packages

### Eligibility Requirements

**Required:**

- iOS-compatible package with a `.podspec` file
- Uses `expo-modules-core` (ExpoModulesCore dependency)
- Only depends on supported external dependencies

**Do NOT add SPM support if:**

- Package has complex third-party native dependencies not already supported
- Package doesn't use expo-modules-core
- Package requires custom build scripts or preprocessing

### Supported External Dependencies

| Dependency                          | Description                            |
| ----------------------------------- | -------------------------------------- |
| `Hermes`                            | Hermes JavaScript engine XCFramework   |
| `React`                             | React Native framework with headers    |
| `ReactNativeDependencies`           | React Native core dependencies         |
| `expo-modules-core/ExpoModulesCore` | Expo modules core (for other packages) |

Third-party SPM packages can also be declared as dependencies via the `spmPackages` field (e.g., Lottie).

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

### Step 3: Podspec (Usually No Changes Needed)

Most podspecs are **auto-patched** at pod install time by `sandbox.rb`. The system intercepts `store_podspec` and applies `patch_spec_for_prebuilt` on-the-fly — no manual podspec changes required.

The only exception is `expo-modules-core`, which uses the inline pattern:

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

### Product Options Reference

| Option                 | Type   | Description                                                                                     |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `name`                 | string | Product/XCFramework name (required)                                                             |
| `podName`              | string | CocoaPods pod name from podspec (required)                                                      |
| `codegenName`          | string | Codegen module name from `codegenConfig.name` in package.json (optional, for Fabric components) |
| `platforms`            | array  | SPM platforms, e.g., `["iOS(.v15)"]`. Supported: `iOS(.v15)`, `macOS(.v11)`, `tvOS(.v15)`, `macCatalyst(.v15)`, `iOS(.v15_1)`, `tvOS(.v15_1)` |
| `externalDependencies` | array  | External package dependencies (React, Hermes, other expo packages)                              |
| `spmPackages`          | array  | Third-party SPM package dependencies (see below)                                                |
| `swiftLanguageVersions`| array  | Swift language versions supported                                                               |
| `textualHeaders`       | array  | Glob patterns for headers marked as textual in the module map                                   |
| `excludeFromUmbrella`  | array  | Glob patterns for headers excluded from the umbrella header                                     |
| `targets`              | array  | Build targets for this product (required)                                                       |

### SPM Package Dependencies

For third-party SPM packages (e.g., Lottie), use the `spmPackages` field:

```json
{
  "spmPackages": [
    {
      "url": "https://github.com/airbnb/lottie-spm.git",
      "productName": "Lottie",
      "packageName": "lottie-spm",
      "version": { "exact": "4.5.0" }
    }
  ]
}
```

Version specifiers: `{ "exact": "4.5.0" }`, `{ "from": "4.0.0" }`, `{ "branch": "main" }`, `{ "revision": "abc123" }`.

### Target Options Reference

| Option               | Type            | Description                                        |
| -------------------- | --------------- | -------------------------------------------------- |
| `type`               | string          | `swift`, `objc`, `cpp`, or `framework`             |
| `name`               | string          | Target name (required)                             |
| `moduleName`         | string          | Module name for headers (defaults to product name) |
| `path`               | string          | Source path relative to package root               |
| `pattern`            | string          | Glob pattern for source files                      |
| `headerPattern`      | string          | Glob pattern for header files (objc/cpp only)      |
| `exclude`            | array           | Paths to exclude from sources                      |
| `dependencies`       | array           | Target dependencies                                |
| `linkedFrameworks`   | array           | System frameworks to link                          |
| `includeDirectories` | array           | Header search paths (objc/cpp only, default: `["include"]`) |
| `compilerFlags`      | array or object | Compiler flags (see below)                         |
| `linkerFlags`        | array           | Linker flags passed to the target                  |
| `resources`          | array           | Resource files to include (objects with `path` and optional `rule`: `"process"` or `"copy"`) |
| `fileMapping`        | array           | File mapping rules (objects with `from`, `to`, `type`) |
| `moduleMapContent`   | string          | Custom module map content                          |
| `publicHeaders`      | boolean         | Whether headers are public (default: `true`)       |
| `vfsOverlayPath`     | string          | Path to VFS overlay file (framework targets only)  |

#### Framework Target Type

The `framework` type references a pre-built binary XCFramework rather than source code:

```json
{
  "type": "framework",
  "name": "SomeFramework",
  "path": "path/to/SomeFramework.xcframework",
  "linkedFrameworks": ["Foundation"]
}
```

#### Compiler Flags

Compiler flags support multiple forms:

```json
// Simple array - applied to all builds
"compilerFlags": ["-DFOO=1"]

// Structured by build type
"compilerFlags": {
  "common": ["-DFOO=1"],
  "debug": ["-DDEBUG"],
  "release": ["-DRELEASE"]
}

// Per-language within variant
"compilerFlags": {
  "common": { "c": ["-std=c11"], "cxx": ["-std=c++17"] },
  "debug": { "c": [...], "cxx": [...] }
}
```

Supported variable substitutions in flags: `${REACT_NATIVE_MINOR_VERSION}`, `${PACKAGE_VERSION}`.

See [`packages/expo-modules-autolinking/external-configs/ios/README.md` — Compiler Flags](../../packages/expo-modules-autolinking/external-configs/ios/README.md#compiler-flags) for more details.

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

### How It Works

The Ruby code in `packages/expo-modules-autolinking/scripts/ios/` handles all CocoaPods integration. There are two main integration paths:

#### Auto-Patching (most packages)

`cocoapods/sandbox.rb` overrides `Sandbox#store_podspec` to intercept podspecs at install time:

1. Calls `patch_spec_for_prebuilt(spec)` — converts the spec to use vendored xcframeworks, strips source-build attributes and bundled dependencies
2. Calls `stub_bundled_pod(spec)` — converts implementation files to header-only patterns for pods bundled inside prebuilt xcframeworks

This means **most podspecs don't need manual modification** to support precompiled modules.

#### Inline Patching (expo-modules-core only)

`ExpoModulesCore.podspec` calls `try_link_with_prebuilt_xcframework(spec)` directly, which sets `spec.source`, `vendored_frameworks`, `prepare_command`, and script phases inline.

### Key Functions

| Function | Purpose |
| -------- | ------- |
| `enabled?` | Checks `EXPO_USE_PRECOMPILED_MODULES=1` |
| `has_prebuilt_xcframework?(pod_name)` | Checks if a tarball exists in build output |
| `build_from_source?(pod_name)` | Checks if pod is configured for source builds via regex patterns |
| `pod_registration_options(...)` | Returns `:podspec` options for prebuilt pods, `:path` for source |
| `register_external_pods(...)` | Registers 3rd-party prebuilt pods BEFORE RN CLI's `use_native_modules!` |
| `patch_spec_for_prebuilt(spec)` | Auto-patches specs on-the-fly (called from sandbox.rb) |
| `try_link_with_prebuilt_xcframework(spec)` | Inline spec patching (used by ExpoModulesCore) |
| `perform_pre_install(installer)` | Downgrades `USE_FRAMEWORKS` for incompatible pods |
| `perform_post_install(installer)` | Runs all post-install configuration steps |
| `ensure_artifacts(installer)` | Copies flavor tarballs into `Pods/<Pod>/artifacts/` |
| `configure_header_search_paths(installer)` | Ensures ExpoModulesJSI headers are found |
| `configure_codegen_for_prebuilt_modules(installer)` | Excludes prebuilt modules from ReactCodegen |
| `stub_bundled_pod_targets(installer)` | Removes implementation sources from bundled pod compile phases |
| `configure_use_frameworks(installer)` | Patches modulemaps and injects flags for `use_frameworks!` builds |
| `disable_swift_interface_verification(installer)` | Adds `SWIFT_EMIT_MODULE_INTERFACE = NO` when prebuilt React active |
| `clear_cocoapods_cache` | Removes stale CocoaPods cache entries for prebuilt pods |

### Pod Registration Flow

`autolinking_manager.rb` controls how pods are registered in the Podfile:

- **Internal Expo pods**: `pod_registration_options()` checks `has_prebuilt_xcframework?` → returns `:podspec` (prebuilt) or `:path` (source)
- **External 3rd-party pods**: `register_external_pods()` registers with `:podspec` BEFORE RN CLI's `use_native_modules!` runs. RN CLI skips already-registered pods, so the `:podspec` registration takes precedence.
- **Bundled dependencies**: SPM dependencies bundled inside prebuilt xcframeworks are stubbed (headers only) to avoid duplicate symbols.

### Environment Variables

| Variable                       | Values             | Description                                    |
| ------------------------------ | ------------------ | ---------------------------------------------- |
| `EXPO_USE_PRECOMPILED_MODULES` | `0`, `1`           | Enable/disable precompiled modules             |
| `EXPO_PRECOMPILED_MODULES_PATH`| path               | Custom base directory for prebuilt XCFrameworks (replaces `packages/precompile/.build/`). Structure: `<pkg>/output/<flavor>/xcframeworks/<Product>.tar.gz` |
| `EXPO_PRECOMPILED_FLAVOR`      | `debug`, `release` | Which XCFramework flavor to use (default: debug) |
| `USE_FRAMEWORKS`               | `dynamic`, `static`| CocoaPods framework linking mode               |
| `RCT_USE_PREBUILT_RNCORE`      | `1`                | Indicates prebuilt React.xcframework is active  |

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
└── artifacts/                        # Copied by ensure_artifacts (post-install)
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

### All Options

| Flag                                          | Description                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `-f, --flavor <flavor>`                       | `Debug` or `Release` (default: both)                                      |
| `-p, --platform <platform>`                   | `iOS`, `macOS`, `tvOS`, or `watchOS` (default: all defined in package)   |
| `-n, --product <name>`                        | Build single product if package has multiple                              |
| `-v, --verbose`                               | Enable verbose output (full build logs instead of spinners)               |
| `--local-react-native-tarball <path>`         | Path to React Native XCFramework tarball. Supports `{flavor}` placeholder |
| `--local-hermes-tarball <path>`               | Path to Hermes XCFramework tarball. Supports `{flavor}` placeholder       |
| `--local-react-native-deps-tarball <path>`    | Path to React Native Dependencies tarball. Supports `{flavor}` placeholder|
| `--react-native-version <version>`            | React Native version (auto-detected from bare-expo if not set)            |
| `--hermes-version <version>`                  | Hermes version                                                            |
| `--include-external`                          | Include external (third-party) packages from `external-configs/ios/`        |
| `-s, --sign <identity>`                       | Code signing identity to sign XCFrameworks                                |
| `--no-timestamp`                              | Disable secure timestamp when signing                                     |
| `-j, --concurrency <number>`                  | Max packages to build in parallel (default: CPU cores / 3)               |
| `--clean`                                     | Clean package outputs before building                                     |
| `--clean-cache`                               | Clear entire dependency cache                                             |

### Pipeline Steps (all run by default)

| Flag               | Description                   |
| ------------------ | ----------------------------- |
| `--skip-artifacts` | Skip downloading dependencies |
| `--skip-generate`  | Skip generating Package.swift |
| `--skip-build`     | Skip building with xcodebuild |
| `--skip-compose`   | Skip creating XCFrameworks    |
| `--skip-verify`    | Skip validating frameworks    |

### Pipeline Structure

The pipeline has 3 scope levels with a nested loop structure:

```
Run-scope steps (once per invocation)
  ├── prepare:inputs    — discover/validate packages, resolve versions
  ├── prepare:cache     — clean cache (if --clean-cache)
  └── prepare:shared-spm-deps — build shared SPM dependencies
      │
      └── Parallel package execution (respecting dependency DAG)
          │
          ├── Package-scope: clean:package (if --clean)
          │
          └── For each flavor × product:
              ├── generate   — codegen + staged source layout + Package.swift
              ├── build      — xcodebuild
              ├── compose    — create .xcframework bundle
              └── verify     — validate headers, modules, typecheck, codesign
```

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
- **Inline podspec pattern**: Only needed for `expo-modules-core`. All other packages are auto-patched by `sandbox.rb` during pod install.
