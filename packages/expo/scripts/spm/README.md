# Expo SwiftPM autolinking plugin

This preview plugin is discovered through `expo/react-native.config.js` by
React Native's `react-native spm` tooling. It contributes Expo source packages,
the generated `ExpoModulesProvider.swift`, and precompiled Expo frameworks.

## Precompiled framework contract

Every precompiled Expo framework is returned as one immutable pair:

```js
{
  id: 'expo-modules-core',
  frameworkName: 'ExpoModulesCore',
  linkage: 'dynamic',
  flavors: {
    debug: '/absolute/path/ExpoModulesCore.xcframework',
    release: '/absolute/path/ExpoModulesCore.xcframework',
  },
}
```

Both flavors are mandatory. A partial build, relative path, wrong XCFramework
name, missing `Info.plist`, or non-dynamic declaration aborts autolinking. The
plugin does not create or mutate a “current flavor” symlink.

Artifact lookup is deterministic:

1. `EXPO_PRECOMPILED_MODULES_PATH/<package>/output/<flavor>/xcframeworks`
2. `packages/precompile/.build/<package>/output/<flavor>/xcframeworks`
3. `<installed-package>/prebuilds/output/<flavor>/xcframeworks`

An artifact may be an expanded `.xcframework` or a bundled `.tar.gz`. Bundled
tarballs are expanded into `ios/build/expo-xcframeworks` before the plugin
returns, so `spm add` and `spm update` always receive both real paths. Expo's
prebuild command builds Debug and Release by default; do not use a single-flavor
prebuild for an app that consumes the SwiftPM plugin.

Lookup runs for **every** resolved pod, not just the core frameworks. Any module
with a `spm.config.json` product is consumed as a precompiled framework the
moment its artifact exists — no `Package.swift` is generated for it, and none is
needed. Path 3 is the published-package case: a module shipping
`prebuilds/output/<flavor>/xcframeworks` is picked up with no local build.

React Native normalizes the declared pairs into immutable app-local Debug and
Release slots. Xcode then selects, exact-links, embeds, and signs the right slot
for each configuration. Configurations containing `debug` or `development` use
Debug; all others use Release. Adding, removing, or changing a flavored Expo
framework requires `npx react-native spm update`; build-time `spm sync` only
refreshes invariant source/codegen output.

## SwiftPM graph

Flavored runtime frameworks are not SwiftPM products or binary targets. The
plugin creates a binary-free compile interface tree containing their public
headers, module maps, and Swift module interfaces. Expo source packages compile
against that stable tree, while React Native owns the only runtime link/embed
path.

Every Expo source target uses exactly the products supplied in
`context.react.products`: `ReactHeaders`, `ReactNativeHeaders`,
`ReactNativeDependenciesHeaders`, and `ReactAppHeaders` when available. The
ExpoModulesCore module map itself declares `use React`, so these invariant
carriers are needed even when a module does not import React directly. The
plugin does not infer runtime React or Hermes products.

## Unsupported modules

A module the plugin cannot contribute aborts autolinking. Dropping it would not
fail the build — it would fail at runtime with `Cannot find native module`, far
from the cause. Each one is reported as an `error:`-prefixed block, which Xcode
surfaces as a build error, naming the fix:

- **A prebuildable product with no built artifact** — the module declares a
  product in its `spm.config.json`, so it needs no `Package.swift`; the artifact
  is simply missing. `et prebuild <package>` (both flavors, so omit `--flavor`)
  fixes it. This is the preferred route for a mixed-language module: the prebuild
  pipeline compiles Swift, Objective-C, and C++ targets into one XCFramework, so
  no source split is required.
- **Mixed Swift and Objective-C/C++ sources with neither manifest** — SwiftPM
  compiles the two languages in separate targets, and only the module can
  declare where its split goes. Either an `spm.config.json`
  (`packages/expo-sensors` is a worked example) or a checked-in `Package.swift`
  (`packages/expo-file-system`) makes it consumable, persisted with
  `patch-package` for a module you do not own, and upstreamed so every consumer
  gets it. This mirrors what React Native's autolinker asks of community
  libraries.
- **No `ios` or `apple` source directory** — an incomplete install, or a
  non-standard layout that needs a `Package.swift` naming the real path.
- **No precompiled ExpoModulesCore** — a single project-level fault reported
  once, not per module, since every source module compiles against its interface
  tree.

To build without a module, exclude it from autolinking in the app's
`package.json` (`expo.autolinking.exclude`); its native module is then
unavailable at runtime.

Emitted modules are also scanned for CocoaPods dependencies with no SwiftPM
counterpart (`SDWebImage`, `ZXingObjC`, …). Those are a warning, not an error:
the module enters the graph and compiles until a source file reaches the missing
dependency.
