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
