# Skill: Convert External Package to Prebuilt XCFramework

You are converting an external React Native package to support prebuilt XCFrameworks in the Expo iOS precompile system.

## Rules

- ONLY create/edit these files: `packages/expo-modules-autolinking/external-configs/ios/<PACKAGE>/spm.config.json`, the podspec in `node_modules/`, and source files in `node_modules/` that need header fixes.
- NEVER create patch files manually. Run `npx patch-package <PACKAGE>` to generate them.
- NEVER build or test the output. Do NOT run `et prebuild-packages` or `pod install`.
- Keep output minimal — short CLI-style status messages only.
- STOP after running `npx patch-package` successfully. That is the last step.

## Steps

### 1. Analyze

Read the podspec and package.json to determine:
- Pod name, codegen name, source directory, language mix, frameworks, dependencies
- Check for header import issues (`#import "RCTFabricComponentsPlugins.h"`, relative `../` imports)

### 2. Fix Header Imports (if needed)

Edit source files in `node_modules/` directly:

**Pattern A** — `#import "RCTFabricComponentsPlugins.h"` becomes `#import <React/RCTFabricComponentsPlugins.h>`

**Pattern B** — Relative parent imports get `__has_include` guards:
```objc
#if __has_include("../Foo.h")
#import "../Foo.h"
#else
#import "Foo.h"
#endif
```

**Pattern C** — Swift classes/methods used from ObjC across module boundaries need `open`/`public`:
```swift
open class MyView: RCTView {
    override public func view() -> UIView! {
```

### 3. Wrap Podspec

Edit the podspec in `node_modules/` to wrap source compilation:

```ruby
# Expo prebuilt xcframework support
if !Expo::PackagesConfig.instance.try_link_with_prebuilt_xcframework(s)
  # Build from source
  s.source_files = "..."
  s.exclude_files = "..."
  s.pod_target_xcconfig = { ... }
  s.dependency "..."
  s.subspec "..." do |ss| ... end
end
```

**Inside the block**: `s.source_files`, `s.exclude_files`, `s.pod_target_xcconfig`, `s.xcconfig`, `s.dependency`, subspecs, `s.resource_bundles`

**Outside the block**: `install_modules_dependencies(s)`, `s.requires_arc`, `s.swift_version`, `s.platforms`, `s.source`, `s.license`, `s.author`, `s.homepage`

### 4. Create spm.config.json

Write `packages/expo-modules-autolinking/external-configs/ios/<PACKAGE>/spm.config.json`.

**Schema path**: `"$schema": "../../../tools/src/prebuilds/schemas/spm.config.schema.json"`

**Product fields**: `name` (= pod name), `podName`, `codegenName` (if has codegen), `platforms: ["iOS(.v15)"]`, `externalDependencies: ["ReactNativeDependencies", "React", "Hermes"]`

**Codegen targets** (when `codegenConfig` exists in package.json):
- C++ components at `.build/codegen/build/generated/ios/ReactCodegen/react/renderer/components/<codegenName>` with `moduleName` matching `codegenName`
- ObjC modules at `.build/codegen/build/generated/ios/ReactCodegen/<codegenName>` with `moduleName`

**Target type rules**:
- `"cpp"` for `.cpp`/`.c` — deps: `["React", "ReactNativeDependencies"]`
- `"objc"` for `.m`/`.mm` — deps: `["Hermes", "React", "ReactNativeDependencies"]`
- `"swift"` for `.swift` — deps: `["Hermes", "React", "ReactNativeDependencies", "expo-modules-core/ExpoModulesCore"]`

**Common compiler flags for ObjC**: `["-include", "Foundation/Foundation.h"]`

**Common excludes**: `["**/*.macos.*", "<PodName>.xcodeproj/**"]`

### 5. Run patch-package

```bash
npx patch-package <PACKAGE>
```

STOP here. Do not proceed further.

## Reference: Existing Converted Packages

Study these for target structure patterns:
- `packages/expo-modules-autolinking/external-configs/ios/react-native-gesture-handler/spm.config.json` — ObjC-only with codegen
- `packages/expo-modules-autolinking/external-configs/ios/react-native-svg/spm.config.json` — ObjC + custom C++ shadow nodes
- `packages/expo-modules-autolinking/external-configs/ios/lottie-react-native/spm.config.json` — Mixed Swift + ObjC + SPM dependency
- `packages/expo-modules-autolinking/external-configs/ios/react-native-screens/spm.config.json` — Mixed Swift + ObjC + C++ + codegen
- `packages/expo-modules-autolinking/external-configs/ios/react-native-safe-area-context/spm.config.json` — ObjC + C++ + codegen
