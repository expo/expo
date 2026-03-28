# External Packages SPM Prebuild

This document explains how to add support for third-party React Native packages to be prebuilt as XCFrameworks using Swift Package Manager.

## Your Task Context

When a user asks you to add SPM prebuild support for an external package, you need to:

1. Create an `spm.config.json` file in `packages/expo-modules-autolinking/external-configs/ios/<package-name>/`
2. Potentially create a patch file if the package source needs modifications
3. Ensure the codegen module is properly excluded from ReactCodegen

## Supported External Packages

Configs live in `packages/expo-modules-autolinking/external-configs/ios/<package-name>/spm.config.json`:

| Package | Product Name |
|---------|-------------|
| `@react-native-async-storage/async-storage` | `RNCAsyncStorage` |
| `@shopify/react-native-skia` | `RNSkia` |
| `lottie-react-native` | `LottieReactNative` |
| `react-native-gesture-handler` | `RNGestureHandler` |
| `react-native-keyboard-controller` | `KeyboardController` |
| `react-native-reanimated` | `RNReanimated` |
| `react-native-safe-area-context` | `RNCSafeAreaContext` |
| `react-native-screens` | `RNScreens` |
| `react-native-svg` | `RNSVG` |
| `react-native-worklets` | `RNWorklets` |

## Key Concepts

> For dependency cache details (location, env vars, clean flags), see [`packages/precompile/README.md` — Dependency Cache](../../../precompile/README.md#dependency-cache).

### Source Resolution

- **Config location**: `packages/expo-modules-autolinking/external-configs/ios/<package-name>/spm.config.json`
- **Source location**: `node_modules/<package-name>/` (resolved at build time)
- **Output location**: `packages/precompile/.build/<package-name>/output/<flavor>/xcframeworks/`

### The SPMPackageSource Interface

The `ExternalPackage` class implements `SPMPackageSource` just like Expo's `Package` class. This means external packages can use the same build pipeline.

## Creating spm.config.json

### Step 1: Analyze the Package

Before creating the config, examine the package thoroughly:

```bash
# Find the package in node_modules
ls -la node_modules/<package-name>/

# Check for existing podspec - note the pod name and module_name
cat node_modules/<package-name>/*.podspec

# Look for ALL source files (check both ios/ and common/ directories)
find node_modules/<package-name>/ios -name "*.swift" -o -name "*.m" -o -name "*.mm" -o -name "*.cpp" -o -name "*.h"
find node_modules/<package-name>/common -name "*.cpp" -o -name "*.h" 2>/dev/null

# Check for resources (metal shaders, assets, etc.)
find node_modules/<package-name>/ios -name "*.metal" -o -name "*.xcassets" -o -name "*.metallib"

# Check the codegenConfig in package.json
cat node_modules/<package-name>/package.json | jq '.codegenConfig'

# Check for bridging headers (indicates Swift-ObjC interop)
find node_modules/<package-name>/ios -name "*Bridging*" -o -name "*bridging*"

# Check for Swift files (determines if you need Swift targets)
find node_modules/<package-name>/ios -name "*.swift" | head -5

# Check for C++ Fabric shadow nodes (common/cpp is the typical location)
ls node_modules/<package-name>/common/cpp/ 2>/dev/null
```

**Key things to determine:**

- **Pod name**: from `s.name` in the podspec
- **Codegen name**: from `codegenConfig.name` in package.json
- **Language mix**: Swift? ObjC? ObjC++? C++? This determines how many targets you need
- **Has Fabric components?**: Look for `common/cpp/` or `#ifdef RCT_NEW_ARCH_ENABLED`
- **Has TurboModules?**: Look for codegen modules in the podspec
- **Has resources?**: Metal shaders, xcassets, metallibs
- **Has bridging headers?**: Indicates Swift code that uses ObjC APIs
- **External native dependencies?**: Check podspec `s.dependency` calls

### Step 2: Understand the Config Structure

Every config uses the `products` format with a `$schema` reference:

```json
{
    "$schema": "../../../../../tools/src/prebuilds/schemas/spm.config.schema.json",
    "products": [
        {
            "name": "ProductName",
            "podName": "pod-name",
            "codegenName": "codegenname",
            "platforms": ["iOS(.v15)"],
            "externalDependencies": ["ReactNativeDependencies", "React", "Hermes"],
            "targets": [...]
        }
    ]
}
```

#### Product-Level Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Product name — used as the xcframework name |
| `podName` | Yes | Exact pod name from the podspec (`s.name`) |
| `codegenName` | When has codegen | Must match `codegenConfig.name` from package.json |
| `platforms` | No | Platform requirement, e.g., `["iOS(.v15)"]` |
| `externalDependencies` | Yes | React Native framework dependencies (see below) |
| `excludeFromUmbrella` | No | Headers to exclude from the auto-generated umbrella header |
| `spmPackages` | No | Remote SPM package dependencies (see [Remote SPM Package Dependencies](#remote-spm-package-dependencies)) |

**`externalDependencies`** — Almost always includes `["ReactNativeDependencies", "React", "Hermes"]`. `Hermes` is required for any package with Fabric components or TurboModules (JSI symbols come from Hermes).

#### Target-Level Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Target name in SPM (must be unique across all targets) |
| `type` | Yes | `"cpp"`, `"objc"`, or `"swift"` — determines the compiler used |
| `path` | Yes | Source directory path relative to the package root in node_modules |
| `pattern` | Yes | Glob pattern for source files, e.g., `"**/*.cpp"`, `"**/*.{m,mm}"`, `"**/*.swift"` |
| `headerPattern` | No | Glob pattern for header files, e.g., `"**/*.h"` |
| `moduleName` | No | Module name for header organization (defaults to product name). Also used for ReactCodegen exclusion on codegen targets |
| `exclude` | No | Array of glob patterns to exclude, e.g., `["**/*.macos.*", "Foo.xcodeproj/**"]` |
| `dependencies` | No | Array of target names and external dependencies this target depends on |
| `includeDirectories` | No | Additional header search paths relative to the target's `path` |
| `linkedFrameworks` | No | System frameworks to link, e.g., `["UIKit", "Foundation", "QuartzCore"]` |
| `compilerFlags` | No | Custom compiler flags (see [Compiler Flags](#compiler-flags)) |
| `fileMapping` | No | Remap file locations for header imports (see [Header File Mapping](#step-4-header-file-mapping)) |
| `moduleMapContent` | No | Custom module map string for C++ header exposure |
| `resources` | No | Array of resource configs for Metal shaders, assets, etc. |

### Step 3: Split Into Targets by Language (The Multi-Target Pattern)

**This is the most important architectural decision.** SPM requires separate targets for different languages. Most React Native packages with Fabric support need multiple targets. Here is the standard pattern:

#### Standard target breakdown

| Target Name | Type | Path | Purpose |
|-------------|------|------|---------|
| `Foo_codegen_components` | `cpp` | `.build/codegen/.../react/renderer/components/<codegenName>` | Generated Fabric C++ props, events, shadow nodes |
| `Foo_codegen_modules` | `objc` | `.build/codegen/.../ReactCodegen/<codegenName>` | Generated TurboModule ObjC spec |
| `Foo_common_cpp` | `cpp` | `common/cpp` | Custom C++ shadow nodes/component descriptors (if package has them) |
| `Foo_objc` | `objc` | `ios` | Pure ObjC files (.m) — events, helpers, categories |
| `Foo_swift` | `swift` | `ios` | Swift source files |
| `Foo` | `objc` | `ios` | ObjC++ (.mm) view managers + module — depends on all above |

**Not every package needs all of these.** Use only what the package requires:

- **No C++ shadow nodes?** Skip `_common_cpp`
- **No Swift?** Skip `_swift` (e.g., react-native-gesture-handler, react-native-svg)
- **No TurboModules?** May not need `_codegen_modules`
- **Pure ObjC (no .mm)?** Can merge ObjC targets
- **All ObjC/ObjC++ in one directory?** Can use a single target with `"**/*.{m,mm}"` pattern

#### Codegen target paths

The codegen targets always follow this path pattern:

```
.build/codegen/build/generated/ios/ReactCodegen/react/renderer/components/<codegenName>   ← C++ components
.build/codegen/build/generated/ios/ReactCodegen/<codegenName>                              ← ObjC modules
```

#### Codegen target `moduleName`

All codegen-related targets **must** have a `moduleName` field matching `codegenConfig.name`. This tells the build system to exclude these sources from ReactCodegen when the xcframework is used. Targets with custom C++ shadow nodes in `common/cpp/` should also have `moduleName` set.

#### Dependency graph

Targets form a dependency chain. The typical pattern:

```
codegen_components ←─┐
codegen_modules ←────┤
common_cpp ←─────────┤ (depends on codegen_components)
objc ←───────────────┤
swift ←──────────────┤
main (objc) ←────────┘ (depends on ALL above)
```

The main target (usually the one named after the product) depends on all other targets and is the one that ties everything together.

### Step 4: Header File Mapping

When source code uses imports like `#import <modulename/subdir/Header.h>`, you need `fileMapping` to create the correct header structure:

```json
{
    "fileMapping": [
        { "from": "*.h", "to": "worklets/apple/{filename}", "type": "header" },
        { "from": "subdir/*.h", "to": "worklets/apple/subdir/{filename}", "type": "header" }
    ]
}
```

**Key points:**

- `from`: Glob pattern relative to target's `path`
- `to`: Destination path with `{filename}` placeholder
- `type`: `"header"` for header files, `"symlink"` for directory symlinks

### Step 5: Handle Swift-ObjC Interop

Many React Native packages mix Swift and Objective-C. SPM handles this differently from CocoaPods:

- **CocoaPods** uses bridging headers (`*-Bridging-Header.h`) for ObjC-to-Swift access
- **SPM** does NOT support bridging headers — instead, Swift and ObjC in the same target can interop automatically, or you split them into separate targets with dependencies

**Common patterns:**

1. **Split into `_swift` and `_objc` targets** — Swift target depends on ObjC target (or vice versa). See the lottie-react-native config for this pattern.
2. **Exclude bridging headers from the umbrella** — Use `excludeFromUmbrella` at the product level:
   ```json
   {
       "excludeFromUmbrella": ["Swift-Bridging.h", "MyPackage-Bridging-Header.h"]
   }
   ```
3. **Patches may be needed** if Swift code imports the auto-generated `-Swift.h` header via a path that doesn't work in SPM.

## Complete Examples

### Example 1: ObjC-only package (react-native-gesture-handler)

No Swift, no custom C++ shadow nodes — just codegen + ObjC/ObjC++ sources:

```json
{
    "$schema": "../../../../../tools/src/prebuilds/schemas/spm.config.schema.json",
    "products": [
        {
            "name": "RNGestureHandler",
            "podName": "RNGestureHandler",
            "codegenName": "rngesturehandler_codegen",
            "platforms": ["iOS(.v15)"],
            "externalDependencies": ["ReactNativeDependencies", "React", "Hermes"],
            "targets": [
                {
                    "type": "cpp",
                    "name": "RNGestureHandler_codegen_components",
                    "moduleName": "rngesturehandler_codegen",
                    "path": ".build/codegen/build/generated/ios/ReactCodegen/react/renderer/components/rngesturehandler_codegen",
                    "pattern": "**/*.cpp",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies"],
                    "includeDirectories": ["../../../.."]
                },
                {
                    "type": "objc",
                    "name": "RNGestureHandler_codegen_modules",
                    "moduleName": "rngesturehandler_codegen",
                    "path": ".build/codegen/build/generated/ios/ReactCodegen/rngesturehandler_codegen",
                    "pattern": "**/*.mm",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies"],
                    "includeDirectories": [".."]
                },
                {
                    "type": "objc",
                    "name": "RNGestureHandler",
                    "path": "apple",
                    "pattern": "**/*.{m,mm}",
                    "headerPattern": "**/*.h",
                    "exclude": ["RNGestureHandler.xcodeproj/**"],
                    "dependencies": [
                        "Hermes", "React", "ReactNativeDependencies",
                        "RNGestureHandler_codegen_components",
                        "RNGestureHandler_codegen_modules"
                    ],
                    "includeDirectories": [".", "../.build/codegen/build/generated/ios/ReactCodegen"],
                    "linkedFrameworks": ["Foundation", "UIKit", "QuartzCore"],
                    "compilerFlags": [
                        "-include", "Foundation/Foundation.h",
                        "-include", "UIKit/UIKit.h",
                        "-DREACT_NATIVE_MINOR_VERSION=${REACT_NATIVE_MINOR_VERSION}"
                    ]
                }
            ]
        }
    ]
}
```

### Example 2: ObjC + custom C++ shadow nodes (react-native-svg)

Adds a `_common_cpp` target for custom shadow node implementations in `common/cpp/`:

```json
{
    "$schema": "../../../../../tools/src/prebuilds/schemas/spm.config.schema.json",
    "products": [
        {
            "name": "RNSVG",
            "podName": "RNSVG",
            "codegenName": "rnsvg",
            "platforms": ["iOS(.v15)"],
            "externalDependencies": ["ReactNativeDependencies", "React", "Hermes"],
            "targets": [
                {
                    "type": "cpp",
                    "name": "RNSVG_codegen_components",
                    "moduleName": "rnsvg",
                    "path": ".build/codegen/build/generated/ios/ReactCodegen/react/renderer/components/rnsvg",
                    "pattern": "**/*.cpp",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies"],
                    "includeDirectories": ["../../../.."]
                },
                {
                    "type": "objc",
                    "name": "RNSVG_codegen_modules",
                    "moduleName": "rnsvg",
                    "path": ".build/codegen/build/generated/ios/ReactCodegen/rnsvg",
                    "pattern": "**/*.mm",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies"],
                    "includeDirectories": [".."]
                },
                {
                    "type": "cpp",
                    "name": "RNSVG_common_cpp",
                    "moduleName": "rnsvg",
                    "path": "common/cpp",
                    "pattern": "**/*.cpp",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies", "RNSVG_codegen_components"],
                    "includeDirectories": [".", "../../.build/codegen/build/generated/ios/ReactCodegen"]
                },
                {
                    "type": "objc",
                    "name": "RNSVG",
                    "path": "apple",
                    "pattern": "**/*.{m,mm}",
                    "headerPattern": "**/*.h",
                    "exclude": ["**/*.macos.*", "RNSVG.xcodeproj/**"],
                    "dependencies": [
                        "Hermes", "React", "ReactNativeDependencies",
                        "RNSVG_codegen_components", "RNSVG_codegen_modules", "RNSVG_common_cpp"
                    ],
                    "includeDirectories": [".", "../.build/codegen/build/generated/ios/ReactCodegen"],
                    "linkedFrameworks": ["Foundation", "UIKit", "CoreGraphics", "QuartzCore", "CoreText", "CoreImage", "Metal"],
                    "compilerFlags": ["-include", "Foundation/Foundation.h"],
                    "resources": [
                        { "path": "apple/Filters/MetalCI/*.iphoneos.metallib", "rule": "copy" }
                    ]
                }
            ]
        }
    ]
}
```

### Example 3: Mixed Swift + ObjC + Fabric (lottie-react-native)

Splits Swift and ObjC into separate targets, plus an SPM remote dependency:

```json
{
    "$schema": "../../../../../tools/src/prebuilds/schemas/spm.config.schema.json",
    "products": [
        {
            "name": "LottieReactNative",
            "podName": "lottie-react-native",
            "codegenName": "lottiereactnative",
            "platforms": ["iOS(.v15)"],
            "externalDependencies": ["ReactNativeDependencies", "React", "Hermes"],
            "spmPackages": [
                {
                    "url": "https://github.com/airbnb/lottie-spm.git",
                    "productName": "Lottie",
                    "version": { "exact": "4.5.0" }
                }
            ],
            "targets": [
                {
                    "type": "cpp",
                    "name": "LottieReactNative_codegen_components",
                    "moduleName": "lottiereactnative",
                    "path": ".build/codegen/build/generated/ios/ReactCodegen/react/renderer/components/lottiereactnative",
                    "pattern": "**/*.cpp",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies", "Hermes"],
                    "includeDirectories": ["../../../.."]
                },
                {
                    "type": "swift",
                    "name": "LottieReactNative",
                    "path": "ios/LottieReactNative",
                    "pattern": "**/*.swift",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies", "Lottie", "LottieReactNative_objc"],
                    "linkedFrameworks": ["UIKit", "Foundation"]
                },
                {
                    "type": "objc",
                    "name": "LottieReactNative_objc",
                    "path": "ios/LottieReactNative",
                    "pattern": "**/*.m",
                    "headerPattern": "**/*.h",
                    "dependencies": ["React", "ReactNativeDependencies"],
                    "linkedFrameworks": ["UIKit", "Foundation"]
                },
                {
                    "type": "objc",
                    "name": "LottieReactNative_fabric",
                    "path": "ios/Fabric",
                    "pattern": "**/*.mm",
                    "headerPattern": "**/*.h",
                    "dependencies": [
                        "React", "ReactNativeDependencies", "Lottie",
                        "LottieReactNative", "LottieReactNative_codegen_components"
                    ],
                    "includeDirectories": ["../../.build/codegen/build/generated/ios/ReactCodegen"],
                    "linkedFrameworks": ["UIKit", "Foundation"]
                }
            ]
        }
    ]
}
```

**Key points for mixed Swift/ObjC packages:**

- Swift and ObjC source from the same directory are split into separate targets using `pattern`
- Swift target depends on `_objc` target for ObjC bridging (or vice versa)
- Fabric ObjC++ (.mm) files get their own target that depends on both Swift and codegen targets
- `Lottie` from `spmPackages` is referenced directly in target `dependencies`

## When to Create Patches

You may need to create a patch (`patches/<package-name>+<version>.patch`) when:

1. **`RCTFabricComponentsPlugins.h` import**: Change `#import "RCTFabricComponentsPlugins.h"` to `#import <React/RCTFabricComponentsPlugins.h>` (very common)
2. **Podspec wrapping**: Add `try_link_with_prebuilt_xcframework` conditional (always needed)
3. **Missing umbrella headers**: The package doesn't expose all needed headers
4. **Include path issues**: Headers use incorrect relative paths for SPM
5. **Swift/ObjC interop**: Need to adjust bridging header patterns for SPM
6. **Build configuration**: Package has iOS version requirements not met

### Creating a Patch

```bash
# Make changes to the package in node_modules
cd node_modules/<package-name>

# Create patch using patch-package
npx patch-package <package-name>
```

The patch will be created at `patches/<package-name>+<version>.patch`.

Don't make that patch manually - always make it by changing the original files and then
run npx patch package.

## Podspec Patch Pattern for External Packages

External packages need their podspec patched to support prebuilt xcframeworks. Use this pattern:

```ruby
# In the podspec, wrap source compilation in this conditional:
if !Expo::PackagesConfig.instance.try_link_with_prebuilt_xcframework(s)
  # Original source compilation code goes here
  s.source_files = "..."
  s.subspec "..." do |ss|
    # ...
  end
end
```

Create the patch with:

```bash
cd /path/to/expo
npx patch-package <package-name>
```

## Validation Checklist

Before completing your work, verify:

- [ ] `spm.config.json` exists at `packages/expo-modules-autolinking/external-configs/ios/<package-name>/spm.config.json`
- [ ] `$schema` field points to `"../../../../../tools/src/prebuilds/schemas/spm.config.schema.json"`
- [ ] Product `podName` matches `s.name` from the podspec
- [ ] Product `codegenName` matches `codegenConfig.name` from package.json (if applicable)
- [ ] All codegen targets have `moduleName` matching the codegenName
- [ ] Target `type` is correct: `"cpp"` for C++, `"objc"` for ObjC/ObjC++, `"swift"` for Swift
- [ ] Source `path` and `pattern` correctly select the right files
- [ ] `exclude` patterns filter out unwanted files (xcodeproj, macOS-only, etc.)
- [ ] Resources (Metal shaders, xcassets, metallibs) are included if present
- [ ] Custom `moduleMapContent` is provided if C++ headers need exposure
- [ ] `linkedFrameworks` includes all system frameworks used by the source
- [ ] Bridging headers are in `excludeFromUmbrella` if present
- [ ] Dependency graph between targets is correct (no circular deps)

## Testing Your Configuration

After creating the config:

```bash
# Build the XCFramework
et prebuild --include-external react-native-svg

# Verify output exists
ls -la packages/precompile/.build/react-native-svg/output/debug/xcframeworks/

# Test in a project
cd apps/bare-expo/ios
pod install
```

## Troubleshooting

### "Module not found" errors

- Check that header search paths in `includeDirectories` are correct
- Verify `moduleMapContent` exports all required headers

### Codegen sources still in ReactCodegen

- Ensure all codegen-related targets have `moduleName` matching `codegenConfig.name`
- This includes `_codegen_components`, `_codegen_modules`, and `_common_cpp` targets (not the main target unless it contains codegen sources)

### Metal shader errors

- Add `resources` array with `"type": "process"` for `.metal` files or `"rule": "copy"` for `.metallib` files

### C++ header visibility issues

- Use `moduleMapContent` to create a custom module map
- Use `fileMapping` to restructure source file locations

### Undefined symbols for JSI (e.g., `facebook::jsi::NativeState::~NativeState()`)

- Add `Hermes` to `externalDependencies` at the product level
- Add `Hermes` to the `dependencies` array of the C++ codegen target
- JSI symbols come from Hermes, which is required for any Fabric component codegen

### Missing `RCTFabricComponentsPlugins.h` or React headers

- Update imports in source code from `#import "RCTFabricComponentsPlugins.h"` to `#import <React/RCTFabricComponentsPlugins.h>`
- This almost always requires a patch file for the package

### Swift bridging header errors

- SPM does not support CocoaPods-style bridging headers
- Split Swift and ObjC into separate targets with proper dependencies
- Add bridging headers to `excludeFromUmbrella`
- May need to patch the source to use `@import` instead of `#import` in some cases

### Stale build artifacts after config changes

- When changing `exclude` patterns, target structure, or file selections, old symlinks from previous builds may persist
- The SPM generator only creates new symlinks — it does not remove files that were previously included but are now excluded
- Run with `--clean` to remove old build output: `et prebuild --clean --include-external <package-name>`
- Symptom: build errors reference symbols from files you've already excluded (e.g., undefined symbol for a Paper/old-arch manager you added to `exclude`)

## Code References

For implementation details, examine these files:

- `tools/src/prebuilds/ExternalPackage.ts` - External package discovery and resolution
- `tools/src/prebuilds/SPMPackage.ts` - SPM Package.swift generation
- `tools/src/prebuilds/Codegen.ts` - Codegen handling
- `packages/expo-modules-autolinking/scripts/ios/precompiled_modules.rb` - Ruby CocoaPods integration

## Cross-Package Dependencies

When an external package depends on another external package's xcframework (e.g., react-native-reanimated depends on react-native-worklets):

### 1. Add the dependency to externalDependencies

```json
{
    "externalDependencies": [
        "ReactNativeDependencies",
        "React",
        "Hermes",
        "RNWorklets"
    ]
}
```

Use the **product name** (not the package name). The product name is the `name` field from the dependency's `spm.config.json`.

### 2. The SPMPackage.ts resolves external package dependencies

The `getExternalPackageByProductName` function in `ExternalPackage.ts` searches all external packages' `spm.config.json` files to find which package provides the requested product. It then returns the xcframework path.

### 3. Use xcframework headers, not source headers

When including headers from a dependency package, use the xcframework headers path instead of source paths:

```json
{
    "includeDirectories": [
        "../../../../react-native-worklets/xcframeworks/debug/RNWorklets.xcframework/ios-arm64/RNWorklets.framework/Headers"
    ]
}
```

**Why**: The xcframework headers include codegen headers and are properly organized. Source headers may have include paths that don't work outside their own build context.

## Compiler Flags

The `compilerFlags` field supports multiple formats for flexibility:

### Simple Array (Applied to All Builds)

```json
{
    "compilerFlags": ["-include", "Foundation/Foundation.h", "-DFOO=1"]
}
```

### Structured Object with Build Variants

```json
{
    "compilerFlags": {
        "common": [...],
        "debug": [...],
        "release": [...]
    }
}
```

### Separate C and C++ Flags

Use this when a flag should only apply to C++ (like `-fno-cxx-modules`):

```json
{
    "compilerFlags": {
        "common": {
            "c": ["-DFOO=1"],
            "cxx": ["-fno-cxx-modules", "-DFOO=1"]
        },
        "debug": ["-DHERMES_ENABLE_DEBUGGER=1"]
    }
}
```

### Common Patterns

#### UIKit/Foundation includes for Objective-C

When building Objective-C code that uses UIKit types (UIScreen, UIApplication, etc.) without importing UIKit explicitly:

```json
{
    "compilerFlags": [
        "-include", "Foundation/Foundation.h",
        "-include", "UIKit/UIKit.h",
        "-include", "QuartzCore/QuartzCore.h"
    ]
}
```

#### Disable C++ modules for std::chrono issues

If you see errors like `declaration of 'system_clock' must be imported from module 'std.chrono'`, use the cxx-specific flag:

```json
{
    "compilerFlags": {
        "common": {
            "cxx": ["-fno-cxx-modules"]
        }
    }
}
```

#### Debug-only Hermes debugger flag

```json
{
    "compilerFlags": {
        "debug": ["-DHERMES_ENABLE_DEBUGGER=1"]
    }
}
```

#### Escaping quotes in compiler flags

For flags that contain quoted strings (like feature flags), use `\\\"` in JSON to get `\"` in the generated Swift:

```json
{
    "compilerFlags": ["-DFEATURE_FLAGS=\\\"[FLAG1:true][FLAG2:false]\\\""]
}
```

## Build Order for Dependent Packages

When packages have dependencies on each other, build them in dependency order:

```bash
# Build worklets first (no external package dependencies)
et prebuild --include-external react-native-worklets ...

# Then build reanimated (depends on worklets)
et prebuild --include-external react-native-reanimated ...

# Or build both together (the system handles ordering):
et prebuild --include-external react-native-worklets react-native-reanimated ...
```

## Remote SPM Package Dependencies

For packages that depend on third-party Swift libraries with official SPM support (like lottie-ios), you can use `spmPackages` to let Swift Package Manager fetch them directly instead of managing xcframeworks yourself.

Use `spmPackages` when the dependency provides official SPM support (like [lottie-spm](https://github.com/airbnb/lottie-spm)). See the [lottie-react-native example](#example-3-mixed-swift--objc--fabric-lottie-react-native) for a complete configuration.

### SPM Package Fields

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Git URL of the SPM package (e.g., `https://github.com/airbnb/lottie-spm.git`) |
| `productName` | Yes | The product name exported by the package (what you import, e.g., `"Lottie"`) |
| `packageName` | No | Override the package identifier. Defaults to last URL path component without `.git` |
| `version` | Yes | Version requirement object (see below) |

### Version Specifications

**Always use `exact` versions for reproducible builds.** The version should match the version pinned in the upstream podspec.

| Format | Example | SPM Output |
|--------|---------|------------|
| `{ "exact": "4.5.0" }` | Pin to exact version | `.package(url: "...", exact: "4.5.0")` |
| `{ "from": "4.0.0" }` | Semver range (>=4.0.0, <5.0.0) | `.package(url: "...", from: "4.0.0")` |
| `{ "branch": "main" }` | Git branch (not recommended) | `.package(url: "...", branch: "main")` |
| `{ "revision": "abc123" }` | Git commit SHA | `.package(url: "...", revision: "abc123")` |

### Using SPM Products in Targets

Add the SPM product name to your target's `dependencies` array. The build system automatically converts it to `.product(name:, package:)` syntax in Package.swift:

```json
{
    "targets": [
        {
            "type": "swift",
            "name": "MyTarget",
            "dependencies": ["React", "Lottie"]
        }
    ]
}
```

Generated Package.swift:

```swift
.target(
    name: "MyTarget",
    dependencies: [
        "React",
        .product(name: "Lottie", package: "lottie-spm")
    ]
)
```

### CI/Offline Build Considerations

SPM fetches remote packages on first build, which requires network access. For CI environments:

1. **Cache `~/.swiftpm`** between builds to avoid re-downloading packages
2. **Or run `swift package resolve`** as a pre-step to download dependencies before the main build
3. **Package.resolved is not committed** - rely on `exact` version pins for reproducibility

### Version Management

When updating packages:

1. Check the upstream podspec for the pinned dependency version
2. Update the `version.exact` field in `spm.config.json` to match
3. Rebuild the xcframework

Example: If lottie-react-native's podspec changes from `s.dependency 'lottie-ios', '4.5.0'` to `'4.6.0'`, update your config:

```json
{
    "spmPackages": [
        {
            "url": "https://github.com/airbnb/lottie-spm.git",
            "productName": "Lottie",
            "version": { "exact": "4.6.0" }
        }
    ]
}
```
