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

## SwiftUI scenes in an isolated iOS app

The generated framework exposes `ExpoHost` and `ExpoScene`. A host loads one JavaScript bundle and shares its React runtime across scenes. Each mounted scene has its own React component state. JavaScript globals and native modules are shared.

Register each component in your JavaScript entry file:

```tsx
import 'expo';
import { AppRegistry } from 'react-native';

import Support from './Support';
import OrderDetails from './OrderDetails';

AppRegistry.registerComponent('Support', () => Support);
AppRegistry.registerComponent('OrderDetails', () => OrderDetails);
```

After rebuilding and adding the generated package to Xcode, create one host in your SwiftUI app. Replace `MyBrownfield` with your framework's module name:

```swift
import SwiftUI
import MyBrownfield

@main
struct MyApp: App {
  @UIApplicationDelegateAdaptor var delegate: ExpoBrownfieldAppDelegate
  @StateObject private var expo = ExpoHost()

  var body: some Scene {
    WindowGroup {
      VStack {
        ExpoScene(name: "Support")
        ExpoScene(name: "OrderDetails", props: ["orderId": "123"])
      }
      .expoHost(expo)
    }
  }
}
```

`ExpoScene` is a SwiftUI `View`. Give it a frame when placing it in a scroll view or another container that does not provide a bounded size. Props must contain values that can be represented in JavaScript: strings, numbers, booleans, arrays, dictionaries, or `NSNull`. Updating props preserves the mounted component's state. Changing the scene name or host remounts it. Removing a scene unmounts its React root while the app retains the host.

`ExpoHost()` starts lazily and loads `main.jsbundle` from the generated framework in both Debug and Release. The framework build embeds JavaScript and assets by default, including Debug simulator builds. Rebuild the framework to update this embedded content. No running Metro server is required to open it.

For live JavaScript development, select Metro when creating the host in a Debug build:

```swift
@StateObject private var expo = ExpoHost(bundleSource: .developmentServer)
```

Run `npx expo start` in the Expo project. This mode does not silently fall back to the embedded bundle. Runtime bundle switching and full `expo-dev-client` support are not included; use `expo-dev-menu` with the isolated integration.

To keep the previous build behavior, set `ios.embeddedBundle: false` in the `expo-brownfield` plugin options and run prebuild again. Debug builds may then require Metro; do not use the default embedded host without supplying an embedded bundle.

Existing `ReactNativeView` and `ReactNativeViewController` integrations can share the new host by calling `ReactNativeHostManager.shared.initialize(host: expo)` before creating their first view. The existing `initialize(turboModuleClasses:)` entry point keeps its previous bundle selection. Supply custom TurboModule classes to `ExpoHost` when using the new entry point.

The app remains responsible for navigation and lifecycle forwarding. `ExpoScene` does not subscribe to the legacy global `popToNative` notification, which cannot identify which of several scenes should dismiss. Use native navigation around the scene. Keep existing app-delegate forwarding when your app already has a delegate.

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

## Embedding multiple brownfield frameworks in one host app (iOS)

When two or more Expo brownfield frameworks need to coexist inside the same host iOS app, set `multipleFrameworks: true` on the iOS plugin config:

```json
{
  "plugins": [
    [
      "expo-brownfield",
      {
        "ios": {
          "targetName": "MyBrownfield",
          "multipleFrameworks": true
        }
      }
    ]
  ]
}
```

Each brownfield framework gets a unique Swift module name (the framework target name), so its public Swift types are already isolated per-app. Every ObjC class registered by the framework gets a `<TargetName>_` prefix via `@objc(...)`, and every ObjC symbol in the pod dependency graph is rewritten with the same prefix at compile time — so two frameworks can ship overlapping pods without duplicate-symbol errors at link time.

The mangling runs as part of `pod install` via a small Ruby shim and a Node worker bundled with `expo-brownfield`. The first run after a dependency change rebuilds the symbol set; subsequent `pod install` invocations are skipped via a dependency-graph checksum.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
