# External Packages SPM Prebuild - Claude Instructions

You are helping with the Expo iOS precompiled modules system. This document explains how to add support for third-party React Native packages to be prebuilt as XCFrameworks using Swift Package Manager.

## Your Task Context

When a user asks you to add SPM prebuild support for an external package, you need to:
1. Create an `spm.config.json` file in `packages/external/<package-name>/`
2. Potentially create a patch file if the package source needs modifications
3. Ensure the codegen module is properly excluded from ReactCodegen

## Directory Structure

```
packages/external/
├── claude.md                    # This file (instructions for you)
├── react-native-svg/
│   └── spm.config.json          # Example: SPM config for react-native-svg
└── react-native-screens/
    └── spm.config.json          # Example: SPM config for react-native-screens
```

## Dependency Cache

The prebuild system uses a centralized versioned cache at `packages/precompile/.cache/` for React Native dependencies (Hermes, ReactNativeDependencies, React). This replaces the old per-package `.dependencies` folder approach.

### How It Works

1. Dependencies are downloaded once to `packages/precompile/.cache/<artifact>/<version>-<flavor>/`
2. Package.swift files reference the cache via relative paths
3. Multiple versions can coexist (e.g., switching between Debug/Release)
4. No copying to individual packages - saves disk space and build time

### Cache Path Override

You can override the cache location with `EXPO_PREBUILD_CACHE_PATH`:

```bash
EXPO_PREBUILD_CACHE_PATH=/custom/cache/path et prebuild-packages ...
```

### Cache Management Options

| Flag | Effect |
|------|--------|
| `--clean-cache` | Wipes entire dependency cache (forces re-download) |
| `--prune-cache` | Removes old cache versions, keeps current version |
| `--clean-all` | Cleans package outputs only - does NOT touch cache |

## Key Concepts

### Source Resolution
- **Config location**: `packages/external/<package-name>/spm.config.json`
- **Source location**: `node_modules/<package-name>/` (resolved at build time)
- **Output location**: `node_modules/<package-name>/.xcframeworks/<buildFlavor>/`

### The SPMPackageSource Interface
The `ExternalPackage` class implements `SPMPackageSource` just like Expo's `Package` class. This means external packages can use the same build pipeline.

## Creating spm.config.json

### Step 1: Analyze the Package

Before creating the config, examine the package:

```bash
# Find the package in node_modules
ls -la node_modules/<package-name>/ios/

# Check for existing podspec
cat node_modules/<package-name>/*.podspec

# Look for source files
find node_modules/<package-name>/ios -name "*.swift" -o -name "*.m" -o -name "*.mm" -o -name "*.cpp"

# Check for resources (metal shaders, assets, etc.)
find node_modules/<package-name>/ios -name "*.metal" -o -name "*.xcassets"

# Check the codegenConfig in package.json
cat node_modules/<package-name>/package.json | grep -A 10 "codegenConfig"
```

### Step 2: Determine Required Fields

#### Basic Config Structure

```json
{
  "apple": {
    "targets": [
      {
        "name": "<TargetName>",
        "type": "library",
        "sources": ["ios"],
        "publicHeadersPath": "ios",
        "dependencies": []
      }
    ]
  }
}
```

#### Important Fields Explained

| Field | Purpose | When to Use |
|-------|---------|-------------|
| `name` | Target name in SPM | Always required. Use the module name from podspec |
| `type` | `"library"` or `"binary"` | Always `"library"` for source builds |
| `sources` | Array of source directories | Paths relative to package root |
| `publicHeadersPath` | Header search path | For Obj-C/C++ headers |
| `resources` | Array of resource configs | For Metal shaders, assets, etc. |
| `fileMapping` | Remap file locations | When headers need path prefixes for imports |
| `moduleMapContent` | Custom module map | For complex C++ header exposure |
| `includeDirectories` | Additional include paths | Paths relative to target's `path` field |
| `compilerFlags` | Custom compiler flags | For defines, includes, warnings |
| `debugCompilerFlags` | Debug-only flags | For flags like `-DHERMES_ENABLE_DEBUGGER=1` |

#### Product-Level Fields (Required)

| Field | Purpose | When to Use |
|-------|---------|-------------|
| `podName` | CocoaPods pod name | **REQUIRED**: The exact name of the pod from the podspec |
| `codegenName` | Codegen module name | When package has Fabric components. Must match `codegenConfig.name` |

### Step 3: Header File Mapping

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

### Step 4: Handle Codegen Exclusion

**CRITICAL**: When a package has codegen (fabric components), you MUST add `codegenName` at the **product level** to identify the codegen module. This ensures the codegen sources are excluded from ReactCodegen when the XCFramework is used.

```json
{
  "products": [
    {
      "name": "RNSVG",
      "podName": "RNSVG",
      "codegenName": "rnsvg",
      "targets": [
        {
          "name": "RNSVG",
          "type": "library",
          "sources": ["apple"],
          "publicHeadersPath": "apple"
        }
      ]
    }
  ]
}
```

**How to find the codegenName:**
```bash
# The codegenName must match codegenConfig.name in package.json
cat node_modules/<package-name>/package.json | jq '.codegenConfig.name'
```

## Complete Examples

### Example 1: react-native-svg (with Metal resources)

```json
{
  "apple": {
    "targets": [
      {
        "name": "rnsvg-codegen",
        "comment": "Identifies codegen module 'rnsvg' for exclusion from ReactCodegen",
        "moduleName": "rnsvg"
      },
      {
        "name": "RNSVG",
        "type": "library",
        "sources": ["apple"],
        "publicHeadersPath": "apple",
        "resources": [
          {
            "type": "process",
            "path": "apple/Shaders.metal"
          }
        ],
        "dependencies": []
      }
    ]
  }
}
```

### Example 2: react-native-screens (with custom moduleMap for C++ headers)

```json
{
  "apple": {
    "targets": [
      {
        "name": "rnscreens-codegen",
        "comment": "Identifies codegen module 'rnscreens' for exclusion from ReactCodegen",
        "moduleName": "rnscreens"
      },
      {
        "name": "RNScreens",
        "type": "library",
        "sources": ["ios"],
        "publicHeadersPath": "ios",
        "fileMapping": {
          "common/cpp": "ios/cpp",
          "ios": "ios"
        },
        "moduleMapContent": "module RNScreens {\n  header \"RNSScreenStack.h\"\n  header \"RNSFullWindowOverlay.h\"\n  export *\n}\n\nmodule RNScreensCxx {\n  header \"ios/cpp/RNSScreenStackHeaderConfigShadowNode.h\"\n  requires cplusplus\n  export *\n}",
        "dependencies": []
      }
    ]
  }
}
```

## When to Create Patches

You may need to create a patch (`patches/<package-name>+<version>.patch`) when:

1. **Missing umbrella headers**: The package doesn't expose all needed headers
2. **Include path issues**: Headers use incorrect relative paths
3. **Swift/ObjC interop**: Need to add `@objc` annotations or bridging headers
4. **Build configuration**: Package has iOS version requirements not met

### Creating a Patch

```bash
# Make changes to the package in node_modules
cd node_modules/<package-name>

# Create patch using patch-package
npx patch-package <package-name>
```

The patch will be created at `patches/<package-name>+<version>.patch`.

## Validation Checklist

Before completing your work, verify:

- [ ] `spm.config.json` exists at `packages/external/<package-name>/spm.config.json`
- [ ] Target name matches the module name from the podspec
- [ ] If package has codegen: target with `moduleName` matching `codegenConfig.name` exists
- [ ] Source paths are correct relative to package root in node_modules
- [ ] Resources (Metal shaders, xcassets) are included if present
- [ ] Custom moduleMapContent is provided if C++ headers need exposure

## Testing Your Configuration

After creating the config:

```bash
# Build the XCFramework
yarn et ios-build-xc react-native-svg

# Verify output exists
ls -la node_modules/react-native-svg/.xcframeworks/

# Test in a project
cd apps/bare-expo/ios
pod install
```

## Troubleshooting

### "Module not found" errors
- Check that `publicHeadersPath` points to the directory containing public headers
- Verify `moduleMapContent` exports all required headers

### Codegen sources still in ReactCodegen
- Ensure target name contains "codegen" (e.g., `rnsvg-codegen`)
- Verify `moduleName` exactly matches `codegenConfig.name` from package.json

### Metal shader errors
- Add `resources` array with `"type": "process"` for `.metal` files

### C++ header visibility issues
- Use `moduleMapContent` to create a custom module map
- Use `fileMapping` to restructure source file locations

## Code References

For implementation details, examine these files:

- `tools/src/prebuilds/ExternalPackage.ts` - External package discovery and resolution
- `tools/src/prebuilds/SPMPackage.ts` - SPM Package.swift generation
- `tools/src/prebuilds/Codegen.ts` - Codegen handling
- `packages/expo-modules-autolinking/scripts/ios/precompiled_modules.rb` - Ruby CocoaPods integration
## Pod Name Configuration

The `podName` field in `spm.config.json` is **required** at the product level. This tells the Ruby code which CocoaPods pod name maps to this package:

```json
{
  "products": [
    {
      "name": "RNSVG",
      "podName": "RNSVG",
      "targets": [...]
    }
  ]
}
```

**Why this is needed**: The `try_link_with_prebuilt_xcframework` function pre-scans all `spm.config.json` files to build a lookup map from pod name → package directory. This allows it to find the xcframework at `node_modules/<package-name>/.xcframeworks/<buildFlavor>/<PodName>.xcframework`.

**How to find the podName:**
```bash
# Check the podspec file for the spec name
grep "spec.name" node_modules/<package-name>/*.podspec
```

## Cross-Package Dependencies

When an external package depends on another external package's xcframework (e.g., react-native-reanimated depends on react-native-worklets):

### 1. Add the dependency to externalDependencies

```json
{
  "externalDependencies": [
    "ReactNativeDependencies",
    "React",
    "Hermes",
    "RNWorklets"  // <-- Add the product name (not package name)
  ]
}
```

### 2. The SPMPackage.ts resolves external package dependencies

The `getExternalPackageByProductName` function in `ExternalPackage.ts` searches all external packages' `spm.config.json` files to find which package provides the requested product. It then returns the xcframework path.

### 3. Use xcframework headers, not source headers

When including headers from a dependency package, use the xcframework headers path instead of source paths:

```json
{
  "includeDirectories": [
    "../../../../react-native-worklets/.xcframeworks/debug/RNWorklets.xcframework/ios-arm64/RNWorklets.framework/Headers"
  ]
}
```

**Why**: The xcframework headers include codegen headers and are properly organized. Source headers may have include paths that don't work outside their own build context.

## Common Compiler Flags

### UIKit/Foundation includes for Objective-C

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

### Disable C++ modules for std::chrono issues

If you see errors like `declaration of 'system_clock' must be imported from module 'std.chrono'`:

```json
{
  "compilerFlags": [
    "-fno-cxx-modules"
  ]
}
```

### Escaping quotes in compiler flags

For flags that contain quoted strings (like feature flags), use `\\\"` in JSON to get `\"` in the generated Swift:

```json
{
  "compilerFlags": [
    "-DFEATURE_FLAGS=\\\"[FLAG1:true][FLAG2:false]\\\""
  ]
}
```

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

## Build Order for Dependent Packages

When packages have dependencies on each other, build them in dependency order:

```bash
# Build worklets first (no external package dependencies)
et prebuild-packages --include-external react-native-worklets ...

# Then build reanimated (depends on worklets)
et prebuild-packages --include-external react-native-reanimated ...

# Or build both together (the system handles ordering):
et prebuild-packages --include-external react-native-worklets --include-external react-native-reanimated ...
```