# 📱 expo-brownfield

`expo-brownfield` provides a toolkit and APIs for integrating Expo into existing native applications.

## API Documentation

You can find the API documentation for the beta release in the [Expo documentation](https://docs.expo.dev/versions/latest/sdk/brownfield/).

## Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the beta release](https://docs.expo.dev/versions/latest/sdk/brownfield/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

## Config plugin

Ensure that you have the `expo-brownfield` plugin included in your `app.json` or `app.config.js` file. You can pass additional configurations (such as iOS target name or Android library name) via the plugin options. If no extra options are added, defaults will be used.

```json
{
  "plugins": ["expo-brownfield"]
}
```

```json
{
  "plugins": [
    [
      "expo-brownfield",
      {
        "ios": {
          "targetName": "MyBrownfield"
        },
        "android": {
          "library": "mybrownfield"
        }
      }
    ]
  ]
}
```

## Configure for Android and iOS

Run `npx expo prebuild` after adding the plugin to your `app.json` file to generate the additional native targets for brownfield.

For projects that don't use CNG please follow the manual steps at [How to add Expo to an existing native (brownfield) app](https://docs.expo.dev/brownfield/get-started/).

## Using Prebuilt modules on iOS

Enable [`expo-build-properties`](https://docs.expo.dev/versions/latest/sdk/build-properties/)'s `ios.usePrecompiledModules` so `pod install` downloads each Expo module as a prebuilt `.xcframework` instead of building it from source. `build:ios` automatically detects those xcframeworks in `ios/Pods/` and bundles them into the output Swift Package alongside the brownfield framework, React, Hermes, and `ReactNativeDependencies`.

```json
{
  "plugins": [
    ["expo-build-properties", { "ios": { "usePrecompiledModules": true } }],
    "expo-brownfield"
  ]
}
```

```sh
npx expo prebuild --platform ios
npx expo-brownfield build:ios --release --package MyAppPackage
```

When precompiled modules are detected, the resulting `artifacts/MyAppPackage-release/` directory is a Swift Package with a single aggregate `.library` product — add it to your host iOS app via Xcode's **Add Package Dependencies → Add Local** and Xcode will link every bundled `.xcframework` automatically.

Swift Package Manager has no per-configuration overload for `.binaryTarget(path:)`, so each output package is pinned to the flavor it was built with. Run `build:ios` once per flavor (e.g. `--debug` and `--release`) and distribute the two packages side by side.

### Shared SPM dependencies

Several Expo modules link against shared Swift Package dependencies (e.g. `expo-image` → `SDWebImage`, `libavif`). To prevent runtime `Library not loaded: @rpath/...` crashes in the host app, `build:ios` looks for each declared SPM dependency in three locations and bundles the first match into the output package:

1. **Inside the pod** — `ios/Pods/<PodName>/<Dep>.xcframework/`, when the prebuilt tarball already includes the dep.
2. **Inside the published npm package** — `node_modules/<package>/prebuilds/output/.../<flavor>/xcframeworks/<Dep>.xcframework/`. This is the path used by Expo modules published with bundled SPM deps and is the recommended setup for projects outside the Expo monorepo.
3. **Shared `.spm-deps/` cache** — either pointed at by `EXPO_PRECOMPILED_MODULES_PATH` (e.g. `EXPO_PRECOMPILED_MODULES_PATH=/path/to/.build`) or auto-discovered at `packages/precompile/.build/.spm-deps/` when running inside the Expo monorepo.

If a declared SPM dependency can't be found in any of these locations, `build:ios` fails with an actionable error rather than shipping a Swift Package that would crash at runtime.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
