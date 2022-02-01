# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.6.5 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.6.4 — 2022-01-05

### 🐛 Bug fixes

- Fix `ReactInstanceManager.onHostPause` exception from moving Android apps to background. ([#15748](https://github.com/expo/expo/pull/15748) by [@kudo](https://github.com/kudo))

## 0.6.3 — 2021-12-16

### 🐛 Bug fixes

- Fixed the deep link wasn't passed to the application if the application wasn't running when the deep link was sent. ([#15593](https://github.com/expo/expo/pull/15593) by [@lukmccall](https://github.com/lukmccall))

## 0.6.2 — 2021-12-15

### 🎉 New features

- Add `onNewIntent` and `onBackPressed` support to `ReactActivityLifecycleListener`. ([#15550](https://github.com/expo/expo/pull/15550) by [@Kudo](https://github.com/Kudo))

## 0.6.1 — 2021-12-08

_This version does not introduce any user-facing changes._

## 0.6.0 — 2021-12-03

### 🎉 New features

- Made `Foundation.URL` a convertible type to consistently normalize file paths to file URLs. ([#15278](https://github.com/expo/expo/pull/15278) by [@tsapeta](https://github.com/tsapeta))
- Improve external Android handlers or listeners backward compatibility by Java 8 interface default method. ([#15421](https://github.com/expo/expo/pull/15421) by [@kudo](https://github.com/kudo))

### 💡 Others

- Add parameter to `ReactNativeHostHandler.onDidCreateReactInstanceManager` on Android. ([#15221](https://github.com/expo/expo/pull/15221) by [@esamelson](https://github.com/esamelson))
- Make the no-argument module initializer unavailable — `onCreate` definition component should be used instead. ([#15262](https://github.com/expo/expo/pull/15262) by [@tsapeta](https://github.com/tsapeta))

## 0.5.0 — 2021-11-17

### 🎉 New features

- Method calls on iOS now can go through the JSI instead of the bridge (opt-in feature). ([#14626](https://github.com/expo/expo/pull/14626) by [@tsapeta](https://github.com/tsapeta))
- `AppDelegateWrapper` is now written in Swift and is independent of the singleton modules. ([#14867](https://github.com/expo/expo/pull/14867) by [@tsapeta](https://github.com/tsapeta))
- Implemented sending native events to JavaScript in Sweet API on iOS. ([#14958](https://github.com/expo/expo/pull/14958) by [@tsapeta](https://github.com/tsapeta))
- [Sweet API] Introduced Convertibles on iOS — a way to use custom types as method arguments if they can be converted from JavaScript values. Provided implementation for some common CoreGraphics types. ([#14988](https://github.com/expo/expo/pull/14988) by [@tsapeta](https://github.com/tsapeta))
- Introduce `ReactActivityHandler` and support `createReactRootView` hook. ([#14883](https://github.com/expo/expo/pull/14883) by [@kudo](https://github.com/kudo))
- [Sweet API] Added support for array types in method arguments on iOS. ([#15042](https://github.com/expo/expo/pull/15042) by [@tsapeta](https://github.com/tsapeta))
- [Sweet API] Added support for optional types in method arguments on iOS. ([#15068](https://github.com/expo/expo/pull/15068) by [@tsapeta](https://github.com/tsapeta))
- [Sweet API] Added support for enums in method arguments on iOS. ([#15129](https://github.com/expo/expo/pull/15129) by [@tsapeta](https://github.com/tsapeta))
- [Sweet API] Automatic conversion is now available for view props setters. ([#15132](https://github.com/expo/expo/pull/15132) by [@tsapeta](https://github.com/tsapeta))
- [Sweet API] Added experimental implementation of the new API in Kotlin. (by [@lukmccall](https://github.com/lukmccall))
- Introduce EXAppDefines to get app building configurations. ([#14428](https://github.com/expo/expo/pull/14428) by [@kudo](https://github.com/kudo))
- Introduce React Native bridge delegate handlers on iOS. ([#15138](https://github.com/expo/expo/pull/15138) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix Gradle error when running Gradle from outside of the project directory. ([#15109](https://github.com/expo/expo/pull/15109) by [@kudo](https://github.com/kudo))

## 0.4.7 — 2021-10-28

### 🐛 Bug fixes

- Fix iOS app freezing in remote debugging mode. ([#14922](https://github.com/expo/expo/pull/14922) by [@kudo](https://github.com/kudo))

## 0.4.6 — 2021-10-27

_This version does not introduce any user-facing changes._

## 0.4.5 — 2021-10-25

_This version does not introduce any user-facing changes._

## 0.4.4 — 2021-10-15

### 🐛 Bug fixes

- Fix UIManager has not setter or ivar error when reloading app. ([#14741](https://github.com/expo/expo/pull/14741) by [@kudo](https://github.com/kudo))

## 0.4.3 — 2021-10-15

_This version does not introduce any user-facing changes._

## 0.4.2 — 2021-10-01

_This version does not introduce any user-facing changes._

## 0.4.1 — 2021-09-29

### 🐛 Bug fixes

- Removed accidentally published prebuilt binaries on iOS.

## 0.4.0 — 2021-09-28

### 🐛 Bug fixes

- Fix imports that affect versioned code inside of Expo Go. ([#14436](https://github.com/expo/expo/pull/14436) by [@cruzach](https://github.com/cruzach))
- Fixed event emitter being registered after module registry initialization. ([#14502](https://github.com/expo/expo/pull/14502) by [@tsapeta](https://github.com/tsapeta))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 0.3.2 — 2021-09-15

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Added `Platform.isAsyncDebugging` to detect remote debugging ([#14396](https://github.com/expo/expo/pull/14396) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Revert prebuilt binaries on iOS to fix build errors. ([#14418](https://github.com/expo/expo/pull/14418) by [@kudo](https://github.com/kudo))

## 0.3.1 — 2021-09-09

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#14350](https://github.com/expo/expo/pull/14350) by [@kudo](https://github.com/kudo))

## 0.3.0 — 2021-09-08

### 🎉 New features

- Expo modules are now being automatically registered on iOS which means less installation steps. Using `EXModuleRegistryProvider` and `EXModuleRegistryAdapter` becomes deprecated. ([#14132](https://github.com/expo/expo/pull/14132) by [@tsapeta](https://github.com/tsapeta))
- Pass `useDeveloperSupport` value to `ReactNativeHostHandler` for expo-updates. ([#14198](https://github.com/expo/expo/pull/14198) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix `Cannot read property 'addProxiedListener' of null` on Android. ([#14343](https://github.com/expo/expo/pull/14343) by [@lukmccall](https://github.com/lukmccall))
- Fix `'-[RCTModuleRegistry getAllExportedModules]: unrecognized selector` crash while adding the event listener. ([#14130](https://github.com/expo/expo/pull/14130) by [@lukmccall](https://github.com/lukmccall))
- Fix redbox error for `Unable to find module for UMReactNativeEventEmitter` in debug build. ([#14276](https://github.com/expo/expo/pull/14276) by [@kudo](https://github.com/kudo))

## 0.3.0-alpha.0 — 2021-08-17

### 🎉 New features

- Use stable manifest ID where applicable. ([#12964](https://github.com/expo/expo/pull/12964) by [@wschurman](https://github.com/wschurman))
- Add permission hook factory. ([#13782](https://github.com/expo/expo/pull/13782) by [@byCedric](https://github.com/byCedric))
- Experimental API for creating native modules in Swift (by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Add generics to the permission hook factory to inherit right types. ([#13860](https://github.com/expo/expo/pull/13860) by [@bycedric](https://github.com/bycedric))

## 0.1.1 — 2021-06-16

_This version does not introduce any user-facing changes._

## 0.1.0 — 2021-06-16

_This version does not introduce any user-facing changes._

## 0.0.2 — 2021-05-25

### 💡 Others

- Added `Interface` suffix to sensors, barcode scanner and font interfaces names to get rid of name collisions. ([#12888](https://github.com/expo/expo/pull/12888), [#12912](https://github.com/expo/expo/pull/12912), [#12949](https://github.com/expo/expo/pull/12949) by [@tsapeta](https://github.com/tsapeta))

## 0.0.1 — 2021-05-07

_This version does not introduce any user-facing changes._
