# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 52.0.0-preview.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [Android] Add support for `onUserLeaveHint`. ([#32033](https://github.com/expo/expo/pull/32033) by [@behenate](https://github.com/behenate))
- Add `expo/dom/entry` for internal DOM component registration. ([#31259](https://github.com/expo/expo/pull/31259) by [@EvanBacon](https://github.com/EvanBacon))
- Enable normal scrolling in DOM components by default on iOS. ([#31197](https://github.com/expo/expo/pull/31197) by [@EvanBacon](https://github.com/EvanBacon))
- Add prototype members `set`, `delete`, `get`, `has`, `forEach`, `entries`, `keys`, `values`, `[Symbol.iterator]` to global `FormData` on native. ([#31117](https://github.com/expo/expo/pull/31117) by [@EvanBacon](https://github.com/EvanBacon))
- Polyfill `Symbol.asyncIterator` on native. ([#31127](https://github.com/expo/expo/pull/31127) by [@EvanBacon](https://github.com/EvanBacon))
- Add initial version of DOM Components and `expo/dom` module. ([#30938](https://github.com/expo/expo/pull/30938) by [@EvanBacon](https://github.com/EvanBacon))
- Support `URL.canParse`. ([#30697](https://github.com/expo/expo/pull/30697) by [@EvanBacon](https://github.com/EvanBacon))
- Add minimal `TextDecoder` support to native client platforms. ([#29620](https://github.com/expo/expo/pull/29620) by [@EvanBacon](https://github.com/EvanBacon))
- Introduced `useEvent` and `useEventListener` hooks for EventEmitter objects (e.g. native modules and shared objects). ([#29056](https://github.com/expo/expo/pull/29056), [#32027](https://github.com/expo/expo/pull/32027) by [@tsapeta](https://github.com/tsapeta))
- Added fetch API support. ([#30173](https://github.com/expo/expo/pull/30173), [#30219](https://github.com/expo/expo/pull/30219), [#30576](https://github.com/expo/expo/pull/30576) by [@kudo](https://github.com/kudo))
- Added `matchContents` prop support to DOM components. ([#31103](https://github.com/expo/expo/pull/31103), [#31731](https://github.com/expo/expo/pull/31731) by [@kudo](https://github.com/kudo))
- Added local `file://` support to the Fetch API. ([#31551](https://github.com/expo/expo/pull/31551) by [@kudo](https://github.com/kudo))
- Added `useDOMImperativeHandle` hook for DOM components to support imperative ref. ([#31108](https://github.com/expo/expo/pull/31108) by [@kudo](https://github.com/kudo))
- Added `useExpoDOMWebView` dom prop for `@expo/dom-webview` DOM components integration. ([#31295](https://github.com/expo/expo/pull/31295) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Add ts-ignore statements to make ts-jest work with polyfill. ([#31244](https://github.com/expo/expo/pull/31244) by [@EvanBacon](https://github.com/EvanBacon))
- Use `globalThis` instead of `global` in the URL implementation to fix issues in Jest. ([#29895](https://github.com/expo/expo/pull/29895) by [@tsapeta](https://github.com/tsapeta))
- Fixed `WebSocket was closed before the connection was established` unhandled exceptions from WebSocketWithReconnect. ([#29904](https://github.com/expo/expo/pull/29904) by [@kudo](https://github.com/kudo))
- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30449](https://github.com/expo/expo/pull/30449) by [@byCedric](https://github.com/byCedric))
- Fixed fetch streaming error on iOS. ([#30604](https://github.com/expo/expo/pull/30604) by [@kudo](https://github.com/kudo))
- Fixed fetch import on Web. ([#30605](https://github.com/expo/expo/pull/30605) by [@kudo](https://github.com/kudo))
- Add support for server root in `expo/scripts/resolveAppEntry.js`. ([#30652](https://github.com/expo/expo/pull/30652) by [@byCedric](https://github.com/byCedric))
- Fixed `devtools` module not found. ([#30933](https://github.com/expo/expo/pull/30933) by [@kudo](https://github.com/kudo))
- Reloads DOM components WebView while app in background and browser renderer processes are gone. ([#31318](https://github.com/expo/expo/pull/31318) by [@kudo](https://github.com/kudo))
- Add missing `types` folder from published package ([#31339](https://github.com/expo/expo/pull/31339) by [@marklawlor](https://github.com/marklawlor))
- Fixed leaking `web-streams-polyfill` imported on web bundles for API routes. ([#31611](https://github.com/expo/expo/pull/31611) by [@byCedric](https://github.com/byCedric))
- Fixed `@expo/dom-webview` resolving error for DOM components. ([#31983](https://github.com/expo/expo/pull/31983) by [@kudo](https://github.com/kudo))

### 💡 Others

- Remove back-compat asset helper from SDK 50. ([#31296](https://github.com/expo/expo/pull/31296) by [@EvanBacon](https://github.com/EvanBacon))
- Refactor web hydration to use `globalThis.__EXPO_ROUTER_HYDRATE__` instead of `process.env.EXPO_PUBLIC_USE_STATIC`. ([#31267](https://github.com/expo/expo/pull/31267) by [@EvanBacon](https://github.com/EvanBacon))
- Remove nested loading for DOM components. ([#31182](https://github.com/expo/expo/pull/31182) by [@EvanBacon](https://github.com/EvanBacon))
- Redesign Fast Refresh overlay for web. ([#30507](https://github.com/expo/expo/pull/30507) by [@EvanBacon](https://github.com/EvanBacon))
- Change `sideEffects` to use `src` folder. ([#29964](https://github.com/expo/expo/pull/29964) by [@EvanBacon](https://github.com/EvanBacon))
- Keep using the legacy event emitter for the `DevLoadingView` in Expo Go. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Re-exported `EventEmitter`, `SharedObject` and `NativeModule` classes from `expo-modules-core`. ([#28994](https://github.com/expo/expo/pull/28994) by [@tsapeta](https://github.com/tsapeta))
- Use the `src` folder as the Metro target. ([#29702](https://github.com/expo/expo/pull/29702) by [@tsapeta](https://github.com/tsapeta))
- Added public assets support for DOM components. ([#30975](https://github.com/expo/expo/pull/30975) by [@kudo](https://github.com/kudo))
- Removed `expo_patch_react_imports!` and align more stardard react-native project layout. ([#31699](https://github.com/expo/expo/pull/31699) by [@kudo](https://github.com/kudo))
- Added a default `AppEntryNotFound` component and prevent the `Invariant Violation: "main" has not been registered.` error. ([#31813](https://github.com/expo/expo/pull/31813) by [@kudo](https://github.com/kudo))
- Decoupled the usage from `@react-native-community/cli-tools`. ([#31966](https://github.com/expo/expo/pull/31966) by [@kudo](https://github.com/kudo))
- Promoted `DevToolsPluginClient.useTransportationNext` as default and removed the option. ([#31852](https://github.com/expo/expo/pull/31852) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- Added support for React Native 0.75.x. ([#30034](https://github.com/expo/expo/pull/30034), [#30828](https://github.com/expo/expo/pull/30828), [#31015](https://github.com/expo/expo/pull/31015) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 51.0.34 - 2024-09-24

_This version does not introduce any user-facing changes._

## 51.0.33 - 2024-09-23

_This version does not introduce any user-facing changes._

## 51.0.32 - 2024-09-03

_This version does not introduce any user-facing changes._

## 51.0.31 - 2024-08-23

### 🐛 Bug fixes

- Fixed expo-updates crash when R8 is enabled on Android. ([#30765](https://github.com/expo/expo/pull/30765) by [@kudo](https://github.com/kudo))

## 51.0.30 - 2024-08-21

_This version does not introduce any user-facing changes._

## 51.0.29 - 2024-08-20

_This version does not introduce any user-facing changes._

## 51.0.28 - 2024-08-14

### 🎉 New features

- Added `useTransportationNext` option for `DevToolsPluginClient` to support binary payload. ([#30935](https://github.com/expo/expo/pull/30935) by [@kudo](https://github.com/kudo))

## 51.0.26 - 2024-08-08

_This version does not introduce any user-facing changes._

## 51.0.24 - 2024-07-30

_This version does not introduce any user-facing changes._

## 51.0.23 - 2024-07-29

### 🎉 New features

- Added `websocketBinaryType` option for `useDevToolsPluginClient` hook. ([#30655](https://github.com/expo/expo/pull/30655) by [@kudo](https://github.com/kudo))

## 51.0.22 - 2024-07-22

_This version does not introduce any user-facing changes._

## 51.0.21 - 2024-07-16

_This version does not introduce any user-facing changes._

## 51.0.20 - 2024-07-11

_This version does not introduce any user-facing changes._

## 51.0.19 - 2024-07-11

_This version does not introduce any user-facing changes._

## 51.0.18 - 2024-07-03

### 📚 3rd party library updates

- Update react-native to 0.74.3. ([#30139](https://github.com/expo/expo/pull/30139) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 51.0.17 - 2024-06-28

_This version does not introduce any user-facing changes._

## 51.0.16 - 2024-06-27

_This version does not introduce any user-facing changes._

## 51.0.15 - 2024-06-20

_This version does not introduce any user-facing changes._

## 51.0.14 - 2024-06-13

_This version does not introduce any user-facing changes._

## 51.0.13 - 2024-06-12

_This version does not introduce any user-facing changes._

## 51.0.12 - 2024-06-10

_This version does not introduce any user-facing changes._

## 51.0.11 - 2024-06-06

_This version does not introduce any user-facing changes._

## 51.0.10 — 2024-06-05

_This version does not introduce any user-facing changes._

## 51.0.9 — 2024-05-29

_This version does not introduce any user-facing changes._

## 51.0.8 — 2024-05-16

_This version does not introduce any user-facing changes._

## 51.0.7 — 2024-05-15

_This version does not introduce any user-facing changes._

## 51.0.6 — 2024-05-14

_This version does not introduce any user-facing changes._

## 51.0.5 — 2024-05-13

_This version does not introduce any user-facing changes._

## 51.0.4 — 2024-05-13

_This version does not introduce any user-facing changes._

## 51.0.3 — 2024-05-10

_This version does not introduce any user-facing changes._

## 51.0.2 — 2024-05-09

_This version does not introduce any user-facing changes._

## 51.0.1 — 2024-05-09

_This version does not introduce any user-facing changes._

## 51.0.0 — 2024-05-06

_This version does not introduce any user-facing changes._

## 51.0.0-preview.14 — 2024-05-04

_This version does not introduce any user-facing changes._

## 51.0.0-preview.13 — 2024-05-03

_This version does not introduce any user-facing changes._

## 51.0.0-preview.12 — 2024-05-03

_This version does not introduce any user-facing changes._

## 51.0.0-preview.11 — 2024-05-02

### 🎉 New features

- Introduced the `reloadAppAsync` to reload the app. ([#28400](https://github.com/expo/expo/pull/28400) by [@kudo](https://github.com/kudo))

## 51.0.0-preview.10 — 2024-05-01

_This version does not introduce any user-facing changes._

## 51.0.0-preview.9 — 2024-05-01

_This version does not introduce any user-facing changes._

## 51.0.0-preview.8 — 2024-04-29

_This version does not introduce any user-facing changes._

## 51.0.0-preview.7 — 2024-04-26

_This version does not introduce any user-facing changes._

## 51.0.0-preview.6 — 2024-04-25

_This version does not introduce any user-facing changes._

## 51.0.0-preview.5 — 2024-04-25

_This version does not introduce any user-facing changes._

## 51.0.0-preview.4 — 2024-04-24

_This version does not introduce any user-facing changes._

## 51.0.0-preview.3 — 2024-04-24

_This version does not introduce any user-facing changes._

## 51.0.0-preview.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 51.0.0-preview.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 51.0.0-preview.0 — 2024-04-19

### 💡 Others

- Updated for dev-client bridgeless mode support. ([#28162](https://github.com/expo/expo/pull/28162) by [@kudo](https://github.com/kudo))

## 51.0.0-beta.0 — 2024-04-18

### 🛠 Breaking changes

- Dropped supports for React Native 0.73 and lower. ([#27601](https://github.com/expo/expo/pull/27601), [#27689](https://github.com/expo/expo/pull/27689), [#27629](https://github.com/expo/expo/pull/27629) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Add global type for `process.env.EXPO_OS` value. ([#27509](https://github.com/expo/expo/pull/27509) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed breaking changes from React-Native 0.74. ([#26357](https://github.com/expo/expo/pull/26357) by [@kudo](https://github.com/kudo))
- Fixed breaking changes from React Native 0.75. ([#27773](https://github.com/expo/expo/pull/27773) by [@kudo](https://github.com/kudo))
- Added `ReactNativeHost.getJSBundleFile()` support for bridgeless mode. ([#27804](https://github.com/expo/expo/pull/27804) by [@kudo](https://github.com/kudo))
- Fixed `NoSuchMethodException` on `getReactHost` when R8 is enabled on Android. ([#27964](https://github.com/expo/expo/pull/27964) by [@kudo](https://github.com/kudo))

### 💡 Others

- Use `typeof window` checks for removing server code. ([#27514](https://github.com/expo/expo/pull/27514) by [@EvanBacon](https://github.com/EvanBacon))
- [expo-updates] Migrate to requireNativeModule/requireOptionalNativeModule. ([#25648](https://github.com/expo/expo/pull/25648) by [@wschurman](https://github.com/wschurman))
- Remove implicit dependency on expo-updates to do runtime version check at runtime. ([#26080](https://github.com/expo/expo/pull/26080) by [@wschurman](https://github.com/wschurman))
- [Android] Added bridgeless support on ReactNativeHostHandler. ([#27629](https://github.com/expo/expo/pull/27629) by [@kudo](https://github.com/kudo))
- [Android] Added `ReactNativeHostHandler.onReactInstanceException()` for expo-updates to handle exceptions on bridgeless mode. ([#27815](https://github.com/expo/expo/pull/27815) by [@kudo](https://github.com/kudo))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
- [Android] Do not use the workaround in the `ReactActivityDelegateWrapper` `onActivityResult` method when using the new architecture. ([#28165](https://github.com/expo/expo/pull/28165) by [@alanjhughes](https://github.com/alanjhughes))
- Introduced `onDidCreateDevSupportManager` handler to support error recovery from expo-updates. ([#28177](https://github.com/expo/expo/pull/28177) by [@kudo](https://github.com/kudo))

## 50.0.14 - 2024-03-20

### 🐛 Bug fixes

- Fixed multiple WebSocket connections created on Web when an app containing multiple dev tools plugins. ([#27702](https://github.com/expo/expo/pull/27702) by [@kudo](https://github.com/kudo))
- Fixed "Error : Unable to send message in a disconnected state." in dev tools plugins from fast refresh. ([#27704](https://github.com/expo/expo/pull/27704) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- Update react-native to 0.73.6. ([#27641](https://github.com/expo/expo/pull/27641) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 50.0.13 - 2024-03-13

_This version does not introduce any user-facing changes._

## 50.0.11 - 2024-03-07

_This version does not introduce any user-facing changes._

## 50.0.10 - 2024-03-07

_This version does not introduce any user-facing changes._

## 50.0.9 - 2024-03-06

_This version does not introduce any user-facing changes._

## 50.0.8 - 2024-02-27

### 💡 Others

- Export `DevToolsPluginClient` from `expo/devtools`. ([#27125](https://github.com/expo/expo/pull/27125) by [@cyrilbo](https://github.com/cyrilbo))

## 50.0.7 - 2024-02-16

### 💡 Others

- Mark the exp prop as optional, this is only used in Expo Go ([#27095](https://github.com/expo/expo/pull/27095) by [@brentvatne](https://github.com/brentvatne))

### 📚 3rd party library updates

- Update react-native to 0.73.4. ([#26774](https://github.com/expo/expo/pull/26774) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 50.0.6 - 2024-02-06

### 🐛 Bug fixes

- Fixed React Native Community CLI not being able to autolink the `expo` package when Expo autolinking is not used. ([#26932](https://github.com/expo/expo/pull/26932) by [@tsapeta](https://github.com/tsapeta))

## 50.0.5 - 2024-02-01

_This version does not introduce any user-facing changes._

## 50.0.4 - 2024-01-26

_This version does not introduce any user-facing changes._

## 50.0.3 - 2024-01-23

_This version does not introduce any user-facing changes._

## 50.0.2 - 2024-01-18

_This version does not introduce any user-facing changes._

## 50.0.1 - 2024-01-18

_This version does not introduce any user-facing changes._

## 50.0.0 - 2024-01-18

_This version does not introduce any user-facing changes._

## 50.0.0-preview.11 - 2024-01-15

_This version does not introduce any user-facing changes._

## 50.0.0-preview.10 - 2024-01-12

_This version does not introduce any user-facing changes._

## 50.0.0-preview.9 - 2024-01-10

### 🎉 New features

- Added support for macOS platform. ([#26283](https://github.com/expo/expo/pull/26283) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Replace deprecated `com.facebook.react:react-native:+` Android dependency with `com.facebook.react:react-android`. ([#26237](https://github.com/expo/expo/pull/26237) by [@kudo](https://github.com/kudo))

## 50.0.0-preview.8 - 2024-01-05

_This version does not introduce any user-facing changes._

## 50.0.0-preview.7 - 2023-12-21

_This version does not introduce any user-facing changes._

## 50.0.0-preview.6 - 2023-12-19

_This version does not introduce any user-facing changes._

## 50.0.0-preview.5 - 2023-12-19

### 🎉 New features

- Added support for React Native 0.73.1. ([#25998](https://github.com/expo/expo/pull/25998) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 50.0.0-preview.4 — 2023-12-15

_This version does not introduce any user-facing changes._

## 50.0.0-preview.3 — 2023-12-14

_This version does not introduce any user-facing changes._

## 50.0.0-preview.2 — 2023-12-13

_This version does not introduce any user-facing changes._

## 50.0.0-preview.1 — 2023-12-12

_This version does not introduce any user-facing changes._

## 50.0.0-preview.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 50.0.0-beta.0 — 2023-12-12

### 🎉 New features

- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- [Android] Fixed `concurrentRoot` is missing from intialProps when running on New Architecture mode. ([#25415](https://github.com/expo/expo/pull/25415) by [@kudo](https://github.com/kudo))
- Use explicit `@expo/metro-config` dependendecy to avoid unexpected versions in monorepos. ([#25804](https://github.com/expo/expo/pull/25804) by [@byCedric](https://github.com/byCedric))
- Fixed `Unable to resolve "fbemitter"` issue when using DevTools Plugins. ([#25856](https://github.com/expo/expo/pull/25856) by [@kudo](https://github.com/kudo))

### 💡 Others

- Update internal types. ([#25627](https://github.com/expo/expo/pull/25627) by [@EvanBacon](https://github.com/EvanBacon))
- Removed the dependency on the `expo-application` package. ([#25583](https://github.com/expo/expo/pull/25583) by [@tsapeta](https://github.com/tsapeta))

## 49.0.21 — 2023-11-24

_This version does not introduce any user-facing changes._

## 49.0.20 — 2023-11-20

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.7 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Remove `expo/scripts/launchPackager.command` script for launching Expo CLI when building iOS apps for development in Xcode. ([#25130](https://github.com/expo/expo/pull/25130) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add support for standard `URL` API. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))
- Added Expo CLI devtools plugins support. ([#24667](https://github.com/expo/expo/pull/24667) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Migrate to `whatwg-url-without-unicode` to fix `SharedArrayBuffer` issue. ([#25005](https://github.com/expo/expo/pull/25005) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Add types for `process.env.EXPO_BASE_URL`. ([#25305](https://github.com/expo/expo/pull/25305) by [@EvanBacon](https://github.com/EvanBacon))
- Revert `URL` support. ([#25006](https://github.com/expo/expo/pull/25006) by [@EvanBacon](https://github.com/EvanBacon))
- Encode Blob components in `URL.createObjectURL`. ([#25004](https://github.com/expo/expo/pull/25004) by [@EvanBacon](https://github.com/EvanBacon))
- Remove deprecated `REACT_NATIVE_OVERRIDE_VERSION` for React Native nightly testing. ([#25151](https://github.com/expo/expo/pull/25151) by [@kudo](https://github.com/kudo))
- Improve DevTools Plugins API. ([#25167](https://github.com/expo/expo/pull/25167) by [@kudo](https://github.com/kudo))
- On Android bump `compileSdkVersion` and `targetSdkVersion` to `31`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 49.0.16 — 2023-10-20

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.6 — 2023-10-17

### 💡 Others

- Export `requireOptionalNativeModule` and `requireNativeModule`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))
- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 49.0.14 — 2023-10-05

### 💡 Others

- Export `requireNativeModule` by [@alanjhughes](https://github.com/alanjhughes)

## 49.0.13 — 2023-09-27

_This version does not introduce any user-facing changes._

## 49.0.12 — 2023-09-25

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.5 — 2023-09-18

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.4 — 2023-09-15

_This version does not introduce any user-facing changes._

## 49.0.11 — 2023-09-15

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.3 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- Reduce size on web. ([#24294](https://github.com/expo/expo/pull/24294) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Move Metro and web TypeScript types from Expo Router to `expo`. ([#24255](https://github.com/expo/expo/pull/24255) by [@marklawlor](https://github.com/marklawlor))
- [iOS] Disable packager and bundle JS when EX_UPDATES_NATIVE_DEBUG set. ([#24366](https://github.com/expo/expo/pull/24366) by [@douglowder](https://github.com/douglowder))

## 49.0.10 — 2023-09-11

_This version does not introduce any user-facing changes._

## 50.0.0-alpha.2 — 2023-09-04

### 🛠 Breaking changes

- Drop legacy `hashAssetFiles` (SDK 32) in favor of `expo-assets` version. ([#24090](https://github.com/expo/expo/pull/24090) by [@EvanBacon](https://github.com/EvanBacon))
- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Add support for React static rehydration on web. ([#23891](https://github.com/expo/expo/pull/23891) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Add support for pnpm isolated modules. ([#23937](https://github.com/expo/expo/pull/23937) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed the environment validator. ([#23732](https://github.com/expo/expo/pull/23732) by [@tsapeta](https://github.com/tsapeta))
- Removed the dependency on the `expo-constants` package. ([#23732](https://github.com/expo/expo/pull/23732) by [@tsapeta](https://github.com/tsapeta))
- Fix `yarn tsc` in the repo. ([#23888](https://github.com/expo/expo/pull/23888) by [@EvanBacon](https://github.com/EvanBacon))

## 50.0.0-alpha.1 — 2023-08-02

### 🛠 Breaking changes

- Drop `Logs` module export. ([#18596](https://github.com/expo/expo/pull/18596) by [@EvanBacon](https://github.com/EvanBacon))
- Drop support for `logUrl` endpoint (legacy `expo-cli` logging will no longer work). ([#18596](https://github.com/expo/expo/pull/18596) by [@EvanBacon](https://github.com/EvanBacon))

## 50.0.0-alpha.0 — 2023-07-28

### 🐛 Bug fixes

- Move `pointerEvents` to `styles.pointerEvents`. ([#23446](https://github.com/expo/expo/pull/23446) by [@EvanBacon](https://github.com/EvanBacon))
- [Android] Fixed splash screen is missing when using the `getDelayLoadAppHandler()` from expo-updates. ([#23747](https://github.com/expo/expo/pull/23747) by [@kudo](https://github.com/kudo))

### 💡 Others

- Fork `uuid@3.4.0` and move into `expo-modules-core`. Remove the original dependency. ([#23249](https://github.com/expo/expo/pull/23249) by [@alanhughes](https://github.com/alanjhughes))

## 49.0.3 — 2023-07-12

### 🎉 New features

- Added support for React Native 0.72.3 ([#23502](https://github.com/expo/expo/pull/23502) by [@tsapeta](https://github.com/tsapeta))

## 49.0.1 — 2023-07-10

_This version does not introduce any user-facing changes._

## 49.0.1 — 2023-07-07

_This version does not introduce any user-facing changes._

## 49.0.1 - 2023-07-07

_This version does not introduce any user-facing changes._

## 49.0.0 - 2023-07-05

_This version does not introduce any user-facing changes._

## 49.0.0-beta.5 - 2023-07-04

_This version does not introduce any user-facing changes._

## 49.0.0-beta.4 - 2023-07-02

### 🐛 Bug fixes

- Use node module resolution when invoking `@expo/cli` from `expo`. ([#23220](https://github.com/expo/expo/pull/23220) by [@byCedric](https://github.com/byCedric))
- Added support for React Native 0.72.1. ([#23262](https://github.com/expo/expo/pull/23262) by [@kudo](https://github.com/kudo))

## 49.0.0-beta.3 - 2023-06-30

_This version does not introduce any user-facing changes._

## 49.0.0-beta.2 - 2023-06-30

_This version does not introduce any user-facing changes._

## 49.0.0-beta.1 - 2023-06-29

_This version does not introduce any user-facing changes._

## 49.0.0-beta.0 — 2023-06-28

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.10 — 2023-06-27

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.9 — 2023-06-24

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.8 — 2023-06-24

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.7 — 2023-06-23

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.6 — 2023-06-22

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.5 — 2023-06-21

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.4 — 2023-06-13

### 📚 3rd party library updates

- Updated `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- Added `ReactActivityHandler.getDelayLoadAppHandler` interface on Android. ([#20273](https://github.com/expo/expo/pull/20273) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))
- Fixed build error when using Expo CLI on bare React Native projects without installing Expo Modules. ([#22649](https://github.com/expo/expo/pull/22649) by [@kudo](https://github.com/kudo))

## 49.0.0-alpha.3 — 2023-05-09

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.2 — 2023-05-08

_This version does not introduce any user-facing changes._

## 49.0.0-alpha.1 — 2023-05-08

### 🛠 Breaking changes

- drop `EXPO_USE_LOCAL_CLI` in favor of using `expo` for the local CLI and `expo-cli` for the global CLI. ([#21388](https://github.com/expo/expo/pull/21388) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add `expo/scripts/launchPackager.command` script for launching Expo CLI when building iOS apps for development in Xcode. ([#21397](https://github.com/expo/expo/pull/21397) by [@EvanBacon](https://github.com/EvanBacon))
- Added internal `export:embed` command for use in Xcode and Android Studio builds. ([#21396](https://github.com/expo/expo/pull/21396) by [@EvanBacon](https://github.com/EvanBacon))
- Export TypeScript types for `expo/metro-config`. ([#21898](https://github.com/expo/expo/pull/21898) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Warn on use of Constants.manifest. ([#22247](https://github.com/expo/expo/pull/22247) by [@wschurman](https://github.com/wschurman))

## 48.0.15 — 2023-04-26

_This version does not introduce any user-facing changes._

## 48.0.14 — 2023-04-26

### 📚 3rd party library updates

- Update `react-native` to 0.71.7. ([#22253](https://github.com/expo/expo/pull/22253) by [@kudo](https://github.com/kudo))

## 48.0.13 — 2023-04-25

_This version does not introduce any user-facing changes._

## 48.0.12 — 2023-04-20

_This version does not introduce any user-facing changes._

## 48.0.11 — 2023-04-13

_This version does not introduce any user-facing changes._

## 48.0.10 - 2023-04-03

### 📚 3rd party library updates

- Update `react-native` to 0.71.6. ([#21909](https://github.com/expo/expo/pull/21909) by [@kudo](https://github.com/kudo))

## 48.0.8 - 2023-03-20

### 🐛 Bug fixes

- Change arg in gradle `.execute()` call to null to inherit env variables from user's env ([#21712](https://github.com/expo/expo/pull/21712) by [@phoenixiguess](https://github.com/phoenixiguess))

## 48.0.7 - 2023-03-14

_This version does not introduce any user-facing changes._

## 48.0.6 - 2023-03-08

_This version does not introduce any user-facing changes._

## 48.0.5 - 2023-03-03

_This version does not introduce any user-facing changes._

## 48.0.4 - 2023-02-23

_This version does not introduce any user-facing changes._

## 48.0.3 - 2023-02-21

_This version does not introduce any user-facing changes._

## 48.0.2 - 2023-02-21

_This version does not introduce any user-facing changes._

## 48.0.1 — 2023-02-15

_This version does not introduce any user-facing changes._

## 48.0.0 — 2023-02-14

_This version does not introduce any user-facing changes._

## 48.0.0-beta.2 — 2023-02-09

_This version does not introduce any user-facing changes._

## 48.0.0-beta.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 48.0.0-beta.0 — 2023-02-03

### 🐛 Bug fixes

- Use React 18 mounting pattern on web to avoid web warning. ([#20965](https://github.com/expo/expo/pull/20965) by [@EvanBacon](https://github.com/EvanBacon))
- Skip mounting root component when DOM is not available. ([#20916](https://github.com/expo/expo/pull/20916) by [@EvanBacon](https://github.com/EvanBacon))
- Use position `fixed` to float fast refresh indicator to the bottom on web. ([#20966](https://github.com/expo/expo/pull/20966) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 47.0.1 — 2022-11-03

_This version does not introduce any user-facing changes._

## 47.0.0 — 2022-11-03

### 🐛 Bug fixes

- Showing warnings for missing native modules rather than throwing errors. ([#19845](https://github.com/expo/expo/pull/19845) by [@kudo](https://github.com/kudo))
- Fixed crashes when running on react-native-v8 runtime. ([#19843](https://github.com/expo/expo/pull/19843) by [@kudo](https://github.com/kudo))
- Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))

## 47.0.0-beta.8 — 2022-11-02

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19369](https://github.com/expo/expo/pull/19369) by [@kudo](https://github.com/kudo))
- Fixed missing _disable-missing-native-module-errors.js_ in the package. ([#19815](https://github.com/expo/expo/pull/19815) by [@kudo](https://github.com/kudo))

## 47.0.0-beta.7 — 2022-10-30

_This version does not introduce any user-facing changes._

## 47.0.0-beta.6 — 2022-10-30

_This version does not introduce any user-facing changes._

## 47.0.0-beta.5 — 2022-10-30

_This version does not introduce any user-facing changes._

## 47.0.0-beta.4 — 2022-10-30

_This version does not introduce any user-facing changes._

## 47.0.0-beta.3 — 2022-10-28

_This version does not introduce any user-facing changes._

## 47.0.0-beta.2 — 2022-10-28

_This version does not introduce any user-facing changes._

## 47.0.0-beta.1 — 2022-10-25

### 🐛 Bug fixes

- Fixed `LottieAnimationViewManager isn't supported in Expo Go` error when running with `lottie-react-native`. ([#19439](https://github.com/expo/expo/pull/19439) by [@kudo](https://github.com/kudo))

## 47.0.0-alpha.1 — 2022-10-06

### 🛠 Breaking changes

- Drop `expo-error-recovery` and `exp.errorRecovery` root component props (unimplemented outside of classic build service). ([#19132](https://github.com/expo/expo/pull/19132) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Re-export `@expo/config-plugins` and `@expo/config` from this package to make it easier for plugins to align on a single version through a peer dependency. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop unused `console.warn` and `console.error` wrappers. ([#18983](https://github.com/expo/expo/pull/18983) by [@EvanBacon](https://github.com/EvanBacon))
- Added capability to throw an error for missing native modules (and `disable-missing-native-module-errors` import to disable this). ([#18465](https://github.com/expo/expo/pull/18465) by [@esamelson](https://github.com/esamelson))
- Added `getNativeModuleIfExists`. ([#18913](https://github.com/expo/expo/pull/18913) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Fixed native entry resolving in release builds when the `app.config.js` has console logs. ([#18906](https://github.com/expo/expo/pull/18906) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `FabricUIManager` errors when turning on new architecture mode on Android. ([#18472](https://github.com/expo/expo/pull/18472) by [@kudo](https://github.com/kudo))
- Added more modules to blacklist for missing native modules errors. ([#18892](https://github.com/expo/expo/pull/18892) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Remove `AppRegistry.setWrapperComponentProvider` in favor of `registerRootComponent`. ([#18984](https://github.com/expo/expo/pull/18984) by [@EvanBacon](https://github.com/EvanBacon))
- Add `@expo/config-plugins` dependency for packages that have a peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))
- Convert `DevAppContainer` to functional React component. ([#18597](https://github.com/expo/expo/pull/18597) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

## 46.0.1 — 2022-07-25

_This version does not introduce any user-facing changes._

## 46.0.0 — 2022-07-25

_This version does not introduce any user-facing changes._

## 46.0.0-beta.7 — 2022-07-25

### 🎉 New features

- Added a feature to automatically generate `.xcode.env.local` with correct `$NODE_BINARY` path when running `pod install`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

## 46.0.0-beta.6 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.5 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.4 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.3 — 2022-07-19

_This version does not introduce any user-facing changes._

## 46.0.0-beta.2 — 2022-07-18

_This version does not introduce any user-facing changes._

## 46.0.0-beta.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.3 — 2022-07-11

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.2 — 2022-07-08

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.1 — 2022-07-08

_This version does not introduce any user-facing changes._

## 46.0.0-alpha.0 — 2022-07-07

### 🎉 New features

- Added web support and bundle splitting support to `DevLoadingView`. ([#17714](https://github.com/expo/expo/pull/17714) by [@EvanBacon](https://github.com/EvanBacon))
- Add `ExpoErrorManager` to improve some commonly logged error messages. ([#18064](https://github.com/expo/expo/pull/18064) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- On Android fixed `onActivityResult` not being propagated by `ReactDelegate` when Android decides to kill and then recreate application `Activity` when low on resources. ([#17572](https://github.com/expo/expo/pull/17572)) by [@bbarthec](https://github.com/bbarthec))
- Fixed `Unable to deactivate keep awake. However, it probably is deactivated already` unhandled promise rejection warning when resuming apps on Android. ([#17319](https://github.com/expo/expo/pull/17319) by [@kudo](https://github.com/kudo))
- Added support for React Native 0.69.x ([#17629](https://github.com/expo/expo/pull/17629) and [#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- Update react-native dependency to 0.68.2. ([#17438](https://github.com/expo/expo/pull/17438) by [@kudo](https://github.com/kudo))

## 45.0.0-beta.9 — 2022-04-28

_This version does not introduce any user-facing changes._

## 45.0.0-beta.8 — 2022-04-27

_This version does not introduce any user-facing changes._

## 45.0.0-beta.7 — 2022-04-27

### 🐛 Bug fixes

- Forward CLI exit code to process. ([#17189](https://github.com/expo/expo/pull/17189) by [@EvanBacon](https://github.com/EvanBacon))

## 45.0.0-beta.6 — 2022-04-27

_This version does not introduce any user-facing changes._

## 45.0.0-beta.5 — 2022-04-25

### 🐛 Bug fixes

- Fix `Overwriting fontFamily style attribute preprocessor` warning when startup. ([#17138](https://github.com/expo/expo/pull/17138) by [@Kudo](https://github.com/Kudo))

## 45.0.0-beta.4 — 2022-04-21

_This version does not introduce any user-facing changes._

## 45.0.0-beta.3 — 2022-04-21

_This version does not introduce any user-facing changes._

## 45.0.0-beta.2 — 2022-04-20

### 🎉 New features

- Add `ReactNativeHostHandler.getUseDeveloperSupport()` to allow `expo-dev-launcher` to override this value at runtime. ([#17069](https://github.com/expo/expo/pull/17069) by [@esamelson](https://github.com/esamelson))

## 45.0.0-beta.1 — 2022-04-18

### 🎉 New features

- Add `EXPO_USE_BETA_CLI` to utilize the new `@expo/cli` versioned package. ([#17007](https://github.com/expo/expo/pull/17007) by [@EvanBacon](https://github.com/EvanBacon))
- Added Android `ReactNativeHostHandler.getJavaScriptExecutorFactory()` for a module to override the `JavaScriptExecutorFactory`. ([#17005](https://github.com/expo/expo/pull/17005) by [@kudo](https://github.com/kudo))
- Add `react`, `react-native`, `react-dom`, and `react-native-web` to `bundledNativeModules.json`. ([#17048](https://github.com/expo/expo/pull/17048) by [@EvanBacon](https://github.com/EvanBacon))
