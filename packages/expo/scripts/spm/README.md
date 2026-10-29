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

Lookup runs for **every** resolved pod except ExpoModulesJSI (see below), not
just the core frameworks. Any module with a `spm.config.json` product is
consumed as a precompiled framework the moment its artifact exists — no
`Package.swift` is generated for it, and none is needed. The exception is a
module the app lists in its `buildFromSource` autolinking option (see below).
Path 3 is the
published-package case: a module shipping
`prebuilds/output/<flavor>/xcframeworks` is picked up with no local build.

React Native normalizes the declared pairs into immutable app-local Debug and
Release slots. Xcode then selects, exact-links, embeds, and signs the right slot
for each configuration. Configurations containing `debug` or `development` use
Debug; all others use Release. Adding, removing, or changing a flavored Expo
framework requires `node <path to react-native>/scripts/setup-apple-spm.js update`,
run from the app root; build-time `spm sync` only refreshes invariant source/codegen
output. The command runs React Native's script directly, because Expo apps do not use
`@react-native-community/cli`, the wrapper that provides `react-native spm`.

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

## ExpoModulesJSI

ExpoModulesJSI is never linked as a precompiled framework, even when a Debug and
Release pair exists, because it must be compiled against the app's React Native.
npm ships only its headers, `ExpoModulesJSIHeaders`, found with the lookup above
in `headers/xcframeworks`. The plugin wraps them in a generated
`ExpoModulesJSIHeaders` package that every Expo source package depends on, and
adds the app target build phase "Build ExpoModulesJSI". Before the app's sources
compile, the phase finds the installed `expo-modules-jsi` and runs its
`apple/scripts/build-swiftpm-app-phase.sh`, which builds the framework into the
build folder, then copies it to where the app links and embeds it. When the
headers carry an `expo-package.json` version stamp, sync fails if that version differs
from the installed `expo-modules-jsi` or from the copy the phase builds.

## Modules built from their checked-in Package.swift

The plugin decides each module in this order:

1. When a precompiled artifact exists, the module is linked precompiled, unless
   the app lists it in `buildFromSource`.
2. Otherwise, when its `Package.swift` depends on the `ExpoModulesCoreHeaders`
   product, the plugin builds it from that manifest as it stands. The manifest
   compiles against the `ExpoModulesCoreHeaders` and `ExpoModulesJSIHeaders`
   xcframeworks.
3. Otherwise its `Package.swift` is mirrored into a generated package, or a
   pure-Swift module gets a generated package over its sources.

A manifest built as it stands is linked at `<outDir>/direct/<npm package name>`,
a symlink to the module root, next to the `ExpoModulesCoreHeaders` package the
plugin emits in `direct/`. Link names are not flattened, so a scoped package
lands at `direct/@scope/pkg`. SwiftPM resolves the manifest's relative paths
from the link, not from the module's real directory, so the path to the headers
package depends on that depth: `../ExpoModulesCoreHeaders` for an unscoped
package, `../../ExpoModulesCoreHeaders` for a scoped one.

`buildFromSource` is the option CocoaPods reads, from
`"expo": { "autolinking": { "buildFromSource": [...] } }` or its `"ios"`
section in the app's package.json. Each entry is a regular expression that must
match the whole pod name or npm package name. Under SwiftPM the entries are
JavaScript regular expressions, so Ruby-only syntax differs: `(?i)` fails the
sync with an error that names the invalid entry, and `\A` matches a literal `A`.
An entry that is a
module's pod name or npm package name, character for character, names it
exactly; any other entry is a pattern. An exact entry for ExpoModulesCore fails
the sync, because every module built from source compiles against the
precompiled ExpoModulesCore. A module named exactly that has an artifact but no
way to be built from source is reported with the reason, and the report asks to
remove the entry so the artifact is used. A module that only a pattern matches,
ExpoModulesCore included, is linked precompiled in that case, and one warning
names each such module and its entry.

## Unsupported modules

A module the plugin cannot contribute aborts autolinking. Dropping it would not
fail the build — it would fail at runtime with `Cannot find native module`, far
from the cause. Each one is reported as an `error:`-prefixed block, which Xcode
surfaces as a build error, naming the fix:

- **A prebuildable product with no built artifact** — the module declares a
  product in its `spm.config.json`, so it needs no `Package.swift`; the artifact
  is simply missing. From the Expo repository root,
  `node tools/bin/expotools.js prebuild <package>` (both flavors, so omit
  `--flavor`) fixes it. This is the preferred route for a mixed-language module: the prebuild
  pipeline compiles Swift, Objective-C, and C++ targets into one XCFramework, so
  no source split is required.
- **Mixed Swift and Objective-C/C++ sources with neither manifest** — SwiftPM
  compiles the two languages in separate targets, and only the module can
  declare where its split goes. Either an `spm.config.json`
  (`packages/expo-sensors` is a worked example) or a checked-in `Package.swift`
  (`packages/expo-constants`) makes it consumable, persisted with
  `patch-package` for a module you do not own, and upstreamed so every consumer
  gets it. This mirrors what React Native's autolinker asks of community
  libraries.
- **No `ios` or `apple` source directory** — an incomplete install, or a
  non-standard layout that needs a `Package.swift` naming the real path.
- **Manifest targets whose sources are not on disk** — a checked-in
  `Package.swift` whose targets declare no `path:` and have no sources under a
  predefined source directory, so the generated targets would point at nothing.
- **Native linkage declared only in the podspec** — `s.frameworks`,
  `s.weak_frameworks` or `s.libraries`. The plugin never reads linkage out of
  Ruby: a misread link line fails in a shipped app, not here. Declare it as
  `linkerSettings` in a `Package.swift`, which the plugin mirrors verbatim, or
  ship an `spm.config.json` and prebuild the module.
- **No precompiled ExpoModulesCore** — a single project-level fault reported
  once, not per module, since every source module compiles against its interface
  tree.

One podspec finding is a warning rather than an error: linker flags set through
`OTHER_LDFLAGS` in a `pod_target_xcconfig`. The module is still emitted, because
Swift links the system frameworks and C++ runtime its sources import; if it does
fail to link, declare the missing library as `linkerSettings` in a
`Package.swift`.

To build without a module, exclude it from autolinking in the app's
`package.json` (`expo.autolinking.exclude`); its native module is then
unavailable at runtime.

Emitted modules are also scanned for CocoaPods dependencies with no SwiftPM
counterpart (`SDWebImage`, `ZXingObjC`, …). Those are a warning, not an error:
the module enters the graph and compiles until a source file reaches the missing
dependency.
