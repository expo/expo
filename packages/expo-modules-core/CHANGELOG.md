# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.2.6 — 2023-03-20

### 🐛 Bug fixes

- [Android] Fixed `ReadableNativeMap` cannot be cast to the `Record`. ([#21773](https://github.com/expo/expo/pull/21773) by [@lukmccall](https://github.com/lukmccall))

## 1.2.5 — 2023-03-14

### 🐛 Bug fixes

- [Android] Fixed coroutine functions crashing when invoked with more than 1 argument. ([#21635](https://github.com/expo/expo/pull/21635) by [@lukmccall](https://github.com/lukmccall))
- [iOS] Fix automatic percent-encoding when converting to the `URL` object. ([#21569](https://github.com/expo/expo/pull/21569) by [@tsapeta](https://github.com/tsapeta))

## 1.2.4 — 2023-03-03

### 🐛 Bug fixes

- [iOS] Fixed jsc import when using use_frameworks ([#21479](https://github.com/expo/expo/pull/21479) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 1.2.3 — 2023-02-21

### 🐛 Bug fixes

- [iOS] Fixed URI with encoded `#` getting cut off. ([#21326](https://github.com/expo/expo/pull/21326) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fail gracefully when the view cannot be constructed due to the missing activity. ([#21328](https://github.com/expo/expo/pull/21328) by [@lukmccall](https://github.com/lukmccall))

## 1.2.2 — 2023-02-14

### 🐛 Bug fixes

- [iOS] Fixed convertible implementation for `URL` type to support unencoded UTF8 urls and file paths. ([#21139](https://github.com/expo/expo/pull/21139) by [@tsapeta](https://github.com/tsapeta))
- Fixed AppDelegateSubscriber broken when running on iOS dynamic framework or static framework mode. ([#21206](https://github.com/expo/expo/pull/21206) by [@kudo](https://github.com/kudo))

## 1.2.1 — 2023-02-09

### 🐛 Bug fixes

- Fix crash when reloading app while expo-av video is playing. ([#21118](https://github.com/expo/expo/pull/21118) by [@janicduplessis](https://github.com/janicduplessis))

## 1.2.0 — 2023-02-03

### 🎉 New features

- View-related DSL functions do not require providing the view's type in function parameters on Android. ([#20751](https://github.com/expo/expo/pull/20751) by [@lukmccall](https://github.com/lukmccall))
- Add support for the `Long` type as function parameters on Android. ([#20787](https://github.com/expo/expo/pull/20787) by [@lukmccall](https://github.com/lukmccall))
- [Android] Added experimental support for building the function result from the object definition. ([#20864](https://github.com/expo/expo/pull/20864) by [@lukmccall](https://github.com/lukmccall))
- Removed boost dependency which needs extra downloading on Android. ([#21000](https://github.com/expo/expo/pull/21000) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix view prop setter not being called when its new value is `null` or `undefined`. ([#20755](https://github.com/expo/expo/pull/20755) & [#20766](https://github.com/expo/expo/pull/20766) by [@tsapeta](https://github.com/tsapeta) & [@lukmccall](https://github.com/lukmccall))
- Fixed "Tried to register two views with the same name" error on fast refresh. ([#20788](https://github.com/expo/expo/pull/20788) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 1.1.1 — 2023-01-06

### 🎉 New features

- Added support for concurrent (async/await) functions in Swift. ([#20645](https://github.com/expo/expo/pull/20645) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Added experimental support for building the function result from the object definition. ([#20623](https://github.com/expo/expo/pull/20623) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed boost build error on Android. ([#20719](https://github.com/expo/expo/pull/20719) by [@kudo](https://github.com/kudo))

## 1.1.0 — 2022-12-30

### 🎉 New features

- Added TS definitions for `TypedArray` and additional union types for Int, Uint and Float TypedArrays. ([#20257](https://github.com/expo/expo/pull/20257) by [@aleqsio](https://github.com/aleqsio))
- Added a new `executeOnJavaScriptThread` method to `appContext` to allow for running code blocks on the JS thread. ([#20161](https://github.com/expo/expo/pull/20161) by [@aleqsio](https://github.com/aleqsio))
- Added the `Exceptions.MissingActivity` on Android. ([#20174](https://github.com/expo/expo/pull/20174) by [@lukmccall](https://github.com/lukmccall))
- Trailing optional arguments can be skipped when calling native functions from JavaScript on iOS. ([#20234](https://github.com/expo/expo/pull/20234) by [@tsapeta](https://github.com/tsapeta))
- `Events` component can now be initialized with an array of event names (not only variadic arguments). ([#20590](https://github.com/expo/expo/pull/20590) by [@tsapeta](https://github.com/tsapeta))
- `Property` component can now take the native shared object instance as the first argument. ([#20608](https://github.com/expo/expo/pull/20608) by [@tsapeta](https://github.com/tsapeta))
- Added support for referencing to `Property`'s owner properties using Swift key paths. ([#20610](https://github.com/expo/expo/pull/20610) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
- Fixed failed resolution of 'java.nio.file.Path' on Android. ([#20037](https://github.com/expo/expo/pull/20037) by [@lukmccall](https://github.com/lukmccall))
- Fixed libraries using the `ViewDefinitionBuilder` crashes when ProGuard or R8 is enabled on Android. ([#20197](https://github.com/expo/expo/pull/20197) by [@lukmccall](https://github.com/lukmccall))
- Fixed Either types not supporting non-primitive types on iOS. ([#20247](https://github.com/expo/expo/pull/20247) by [@tsapeta](https://github.com/tsapeta))
- Fixed Function not supporting certain arities on Android. ([#20419](https://github.com/expo/expo/pull/20419) by [@motiz88](https://github.com/motiz88))
- Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))
- Fixed the `SharedObject` initializer being inaccessible due to `internal` protection level. ([#20588](https://github.com/expo/expo/pull/20588) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] Make `Enumerable` protocol implement `CaseIterable` to get rid of operating on unsafe pointers. ([#20640](https://github.com/expo/expo/pull/20640) by [@tsapeta](https://github.com/tsapeta))

## 1.0.4 - 2022-12-21

### 🐛 Bug fixes

- Fixed views are not correctly initialized after reloading on Android. ([#20063](https://github.com/expo/expo/pull/20063) by [@lukmccall](https://github.com/lukmccall))
- Fixed threading crash issue when running with Hermes on iOS. ([#20506](https://github.com/expo/expo/pull/20506) by [@kudo](https://github.com/kudo))

## 1.0.2 - 2022-11-08

### 💡 Others

- Rephrased the message of `ArgumentCastException` to use ordinal numbers. ([#19912](https://github.com/expo/expo/pull/19912) by [@tsapeta](https://github.com/tsapeta))

## 1.0.1 - 2022-11-07

### 🐛 Bug fixes

- Added a list of the acceptable enum values to the conversion error on Android. ([#19895](https://github.com/expo/expo/pull/19895) by [@lukmccall](https://github.com/lukmccall))
- Fixed `new NativeEventEmitter() was called with a non-null argument without the required addListener method.` warnings on Android with JSC. ([#19920](https://github.com/expo/expo/pull/19920) by [@kudo](https://github.com/kudo))

### 💡 Others

- Exposed coroutines related packages on Android. ([#19896](https://github.com/expo/expo/pull/19896) by [@lukmccall](https://github.com/lukmccall))

## 1.0.0 — 2022-11-03

_This version does not introduce any user-facing changes._

## 0.13.4 — 2022-11-02

### 🐛 Bug fixes

- Fixed build errors when testing on React Native nightly builds. ([#19369](https://github.com/expo/expo/pull/19369) by [@kudo](https://github.com/kudo))

## 0.13.3 — 2022-10-30

### 🎉 New features

- Added `AppContext.hasActiveReactInstance` on Android. ([#19723](https://github.com/expo/expo/pull/19723) by [@lukmccall](https://github.com/lukmccall))

## 0.13.2 — 2022-10-28

### 🐛 Bug fixes

- Fixed `new NativeEventEmitter() was called with a non-null argument without the required addListener method.` warnings on Android. ([#19704](https://github.com/expo/expo/pull/19704) by [@kudo](https://github.com/kudo), [@kudo](https://github.com/kudo))

## 0.13.1 — 2022-10-27

### 🐛 Bug fixes

- Fixed `~CallbackWrapper()` dangling pointer crashes when reloading the app on Android. ([#19699](https://github.com/expo/expo/pull/19699) by [@kudo](https://github.com/kudo), [@kudo](https://github.com/kudo))

## 0.13.0 — 2022-10-25

### 🛠 Breaking changes

- Convertible enums must inherit from `expo.modules.kotlin.types.Enumerable` on Android. ([#19551](https://github.com/expo/expo/pull/19551) by [@lukmccall](https://github.com/lukmccall))
- `AppContext.currentActivity` is not longer returning `AppCompatActivity`, but an instance of `android.app.Activity` class. ([#19573](https://github.com/expo/expo/pull/19573) by [@lukmccall](https://github.com/lukmccall))

### ⚠️ Notices

- Deprecated `ConvertibleArgument` in favor of `Convertible` and `EnumArgument` in favor of `Enumerable`. ([#19612](https://github.com/expo/expo/pull/19612) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Implemented a mechanism for hooking into to the view lifecycle events (introduces new `OnViewDidUpdateProps` definition component). ([#19549](https://github.com/expo/expo/pull/19549) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed records aren't correctly converted to JS objects in the release builds on Android. ([#19551](https://github.com/expo/expo/pull/19551) by [@lukmccall](https://github.com/lukmccall))
- Reject promises with a `CodedError` instead of a plain object. ([#19605](https://github.com/expo/expo/pull/19605) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Simplified dispatching view events. ([#19537](https://github.com/expo/expo/pull/19537) by [@tsapeta](https://github.com/tsapeta))

## 0.12.0 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Removed deprecated module definition components that started with a lowercase letter. ([#18851](https://github.com/expo/expo/pull/18851) by [@tsapeta](https://github.com/tsapeta))
- Added support for React Native 0.70.x. ([#19261](https://github.com/expo/expo/pull/19261) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Added the interface for the light sensor support on Android. ([#18225](https://github.com/expo/expo/pull/18225) by [bearkillerPT](https://github.com/bearkillerPT))
- Add better JSI error handling on Android. ([#18259](https://github.com/expo/expo/pull/18259) by [@lukmccall](https://github.com/lukmccall))
- Experimental support for typed arrays on Android. ([#18379](https://github.com/expo/expo/pull/18379) by [@lukmccall](https://github.com/lukmccall))
- Using JSI instead of the bridge to call native methods also on legacy modules on iOS. ([#18438](https://github.com/expo/expo/pull/18438) by [@tsapeta](https://github.com/tsapeta))
- Experimental support for Fabric on iOS. ([#18500](https://github.com/expo/expo/pull/18500), [#18678](https://github.com/expo/expo/pull/18678) by [@tsapeta](https://github.com/tsapeta))
- Added view prop callbacks support for old-style views written in Objective-C. ([#18636](https://github.com/expo/expo/pull/18636) by [@tsapeta](https://github.com/tsapeta))
- Add Logger support for writing logs to a file; add Logger and associated classes to Android. ([#18513](https://github.com/expo/expo/pull/18513) by [@douglowder](https://github.com/douglowder))
- Experimental support for Fabric on Android. ([#18541](https://github.com/expo/expo/pull/18541) by [@kudo](https://github.com/kudo))
- Add option to generate a `coalescingKey` in callback on Android. ([#18774](https://github.com/expo/expo/pull/18774) by [@lukmccall](https://github.com/lukmccall))
- Automatically convert records to dicts when returned by the function. ([#18824](https://github.com/expo/expo/pull/18824) by [@tsapeta](https://github.com/tsapeta))
- Closures passed to definition components are now implicitly capturing `self` on iOS. ([#18831](https://github.com/expo/expo/pull/18831) by [@tsapeta](https://github.com/tsapeta))
- Support for CSS named colors in `UIColor` and `CGColor` convertibles on iOS. ([#18845](https://github.com/expo/expo/pull/18845) by [@tsapeta](https://github.com/tsapeta))
- Lazy load building the module's JavaScript object from the definition on iOS (already implemented on Android). ([#18863](https://github.com/expo/expo/pull/18863) by [@tsapeta](https://github.com/tsapeta))
- Inferring the view type in `Prop` setter closure. ([#19004](https://github.com/expo/expo/pull/19004) by [@tsapeta](https://github.com/tsapeta))
- [core] Added `REACT_NATIVE_DOWNLOADS_DIR` environment variable to specify custom third party libraries download location. ([#19015](https://github.com/expo/expo/pull/19015) by [@kudo](https://github.com/kudo))
- Add support for the `android.graphics.Color` class as the function parameter. ([#19054](https://github.com/expo/expo/pull/19054) by [@lukmccall](https://github.com/lukmccall))
- Add support for `android.net.Uri`, `java.io.File`, `java.net.URI` and `java.nio.file.Path` classes as function parameters. ([#19169](https://github.com/expo/expo/pull/19169) by [@lukmccall](https://github.com/lukmccall))
- Add the `RegisterActivityContracts` component to register all of activity result contracts on Android. ([#19180](https://github.com/expo/expo/pull/19180) by [@lukmccall](https://github.com/lukmccall))
- Improves JSI/JNI type conversion to support complex function arguments on Android. ([#19120](https://github.com/expo/expo/pull/19120) & [#19094](https://github.com/expo/expo/pull/19094) by [@lukmccall](https://github.com/lukmccall))
- Using JSI instead of the bridge to call native methods also on legacy modules on iOS. ([#19209](https://github.com/expo/expo/pull/19209) by [@lukmccall](https://github.com/lukmccall))
- Added `cacheDirectory` and `persistentFilesDirectory` to `AppContext` on Android to fix cache directories being incorrect in new Sweet API modules. It uses a new `AppDirectoriesModule` to get correct scoped directories from old module API. ([#19205](https://github.com/expo/expo/pull/19205) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- Fixed the `2 files found with path 'lib/arm64-v8a/libfbjni.so'` error on Android. ([#18607](https://github.com/expo/expo/pull/18607) by [@lukmccall](https://github.com/lukmccall))
- Fixed event dispatching for Sweet API views when running in Fabric mode on Android. ([#18814](https://github.com/expo/expo/pull/18814) by [@kudo](https://github.com/kudo))
- Update gradle excludes to fix detox tests. ([#19254](https://github.com/expo/expo/pull/19254) by [@esamelson](https://github.com/esamelson))
- Fixed event listeners do not work when running with remote debugging mode on iOS. ([#19211](https://github.com/expo/expo/pull/19211) by [@kudo](https://github.com/kudo))
- Use shared C++ runtime to reduce library size on Android. ([#19372](https://github.com/expo/expo/pull/19372) by [@kudo](https://github.com/kudo))
- Fixed `JSCRuntime destroyed with a dangling API object` on Android. ([#19487](https://github.com/expo/expo/pull/19487) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Centralized Android emulator detection for native code and added checks to pick up additional emulator types in `EmulatorUtilities`. ([#16177](https://github.com/expo/expo/pull/16177)) by [@kbrandwijk](https://github.com/kbrandwijk), [@keith-kurak](https://github.com/keith-kurak))
- Created a separate high priority queue for all async function calls. ([#18734](https://github.com/expo/expo/pull/18734) by [@tsapeta](https://github.com/tsapeta))
- The host object for native modules is now installed as `global.expo.modules` instead of `global.ExpoModules`. ([#19273](https://github.com/expo/expo/pull/19273) & [#19281](https://github.com/expo/expo/pull/19281) by [@tsapeta](https://github.com/tsapeta), [@lukmccall](https://github.com/lukmccall))

## 0.11.7 — 2022-10-06

### 🐛 Bug fixes

- Fixed `ModuleRegistry` initialized twice when startup on Android. ([#19384](https://github.com/expo/expo/pull/19384) by [@kudo](https://github.com/kudo) and [@lukmccall](https://github.com/lukmccall))
- Ensure that AppDelegate callbacks are invoked. ([#19393](https://github.com/expo/expo/pull/19393) by [@ferologics](https://github.com/ferologics))
- Fixed Android crash when Activity is destroyed before `AppContext.onHostDestroy` call. ([#19406](https://github.com/expo/expo/pull/19406) by [@kudo](https://github.com/kudo))

## 0.11.6 — 2022-10-02

### 🐛 Bug fixes

- Give precedence to `UIBackgroundFetchResult.newData` over `.failed` in proxied `ExpoAppDelegate.swift` completion handlers. ([#19311](https://github.com/expo/expo/pull/19311) by [@ferologics](https://github.com/ferologics))

## 0.11.5 — 2022-09-01

### 🐛 Bug fixes

- Removed the hard dependency to Hermes or JSC in _libexpo-modules-core.so_ on Android and fixed the broken support for react-native-v8. ([#18899](https://github.com/expo/expo/pull/18899) by [@kudo](https://github.com/kudo))

## 0.11.4 — 2022-08-18

### 🐛 Bug fixes

- Fix issue with Android builds when gradle clean and build were called concurrently. ([#18518](https://github.com/expo/expo/pull/18518) by [EdwardDrapkin](https://github.com/EdwardDrapkin))
- Fixed `FabricUIManager` errors when turning on new architecture mode on Android. ([#18472](https://github.com/expo/expo/pull/18472) by [@kudo](https://github.com/kudo))

## 0.11.3 — 2022-07-18

### 💡 Others

- Changed access levels in the Logger and fixed the timer to log milliseconds instead of seconds. ([#18271](https://github.com/expo/expo/pull/18271) by [@douglowder](https://github.com/douglowder))

## 0.11.2 — 2022-07-16

### 🐛 Bug fixes

- Fix dangling pointer in the fbjni from the MethodMetadata::createPromiseBody on Android. ([#18206](https://github.com/expo/expo/pull/18206) by [@lukmccall](https://github.com/lukmccall))

## 0.11.1 — 2022-07-11

### 🐛 Bug fixes

- Fixed a crash when remote debugging is enabled on Android. ([#18165](https://github.com/expo/expo/pull/18165) by [@kudo](https://github.com/kudo))

## 0.11.0 — 2022-07-07

### 🎉 New features

- Create `AppContext.registerForActivityResult` mechanism similar to [`ComponentActivity.registerForActivityResult`](https://developer.android.com/training/basics/intents/result)). ([#17572](https://github.com/expo/expo/pull/17572), ([#17987](https://github.com/expo/expo/pull/17987) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Added support for React Native 0.69.x ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))

## 0.10.0 — 2022-06-23

### 🎉 New features

- Add proxy methods for `Permissions` module accepting `expo.modules.kotlin.Promise` on Android. ([#17668](https://github.com/expo/expo/pull/17668) by [@bbarthec](https://github.com/bbarthec))
- Create `CurrentActivityProvider` on Android. ([#17571](https://github.com/expo/expo/pull/17571) by [@bbarthec](https://github.com/bbarthec))
- Create `AppContextProvider` on Android. ([#17546](https://github.com/expo/expo/pull/17546) by [@bbarthec](https://github.com/bbarthec))
- Introduce dynamic properties in the Sweet API on iOS. ([#17318](https://github.com/expo/expo/pull/17318) by [@tsapeta](https://github.com/tsapeta))
- Implemented classes in the Sweet API on iOS. ([#17514](https://github.com/expo/expo/pull/17514), [#17525](https://github.com/expo/expo/pull/17525) by [@tsapeta](https://github.com/tsapeta))
- Add basic support for sync functions in the Sweet API on Android. ([#16977](https://github.com/expo/expo/pull/16977) by [@lukmccall](https://github.com/lukmccall))
- Better error handling in the synchronous functions on iOS. ([#17628](https://github.com/expo/expo/pull/17628) by [@tsapeta](https://github.com/tsapeta))
- Experimental support for typed arrays on iOS. ([#17667](https://github.com/expo/expo/pull/17667) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix modules have not been deallocated during the application reload on iOS. ([#17285](https://github.com/expo/expo/pull/17285) by [@lukmccall](https://github.com/lukmccall))
- Fix view props weren't recognized in the bare workflow on iOS. ([#17411](https://github.com/expo/expo/pull/17411) by [@lukmccall](https://github.com/lukmccall))
- Fix support for optional function arguments on iOS. ([#17950](https://github.com/expo/expo/pull/17950) by [@barthap](https://github.com/barthap))
- Added support for React Native 0.69.x ([#17629](https://github.com/expo/expo/pull/17629) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))
- Refactored Expo modules registration and the `AppContext` on iOS. ([#17225](https://github.com/expo/expo/pull/17225) by [@tsapeta](https://github.com/tsapeta))
- Split the implementation of async and sync functions on iOS. ([#17188](https://github.com/expo/expo/pull/17188) by [@tsapeta](https://github.com/tsapeta))

## 0.9.0 — 2022-04-21

### ⚠️ Notices

- Renamed all definition components to start with the uppercase letter. The old names will be removed in the next minor release. ([#17153](https://github.com/expo/expo/pull/17153) by [@lukmccall](https://github.com/lukmccall), [#17098](https://github.com/expo/expo/pull/17098) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Add `ReactNativeHostHandler.getUseDeveloperSupport()` to allow `expo-dev-launcher` to override this value at runtime. ([#17069](https://github.com/expo/expo/pull/17069) by [@esamelson](https://github.com/esamelson))

## 0.8.0 — 2022-04-18

### 🛠 Breaking changes

- Remove backward compatible workaround and drop react-native 0.64 support. ([#16446](https://github.com/expo/expo/pull/16446) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- Deprecated current behavior of `function` module definition component in favor of `asyncFunction` to emphasize that it's being executed asynchronously in JavaScript. In the future release `function` will become synchronous. ([#16630](https://github.com/expo/expo/pull/16630) by [@tsapeta](https://github.com/tsapeta), [#16656](https://github.com/expo/expo/pull/16656) by [@lukmccall](https://github.com/lukmccall))
- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Add `getDevSupportManagerFactory` support to `ReactNativeHostHandler`. ([#16434](https://github.com/expo/expo/pull/16434) by [@lukmccall](https://github.com/lukmccall))
- Add support for automatic setup of `expo-dev-client` on Android. ([#16441](https://github.com/expo/expo/pull/16441) by [@esamelson](https://github.com/esamelson))
- Stopped relying on deprecated `ViewPropTypes` from React Native. ([#16207](https://github.com/expo/expo/pull/16207) by [@tsapeta](https://github.com/tsapeta))
- Added Android `ReactNativeHostHandler.getJavaScriptExecutorFactory()` for a module to override the `JavaScriptExecutorFactory`. ([#17005](https://github.com/expo/expo/pull/17005) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix the `Fatal error: Expo modules provider must implement "ModulesProviderProtocol"` runtime error in XCTest targets and SwiftUI Preview. ([#16733](https://github.com/expo/expo/pull/16733) by [@kudo](https://github.com/kudo))

### 💡 Others

- Removed the opt-in feature to use the turbo module implementation of `NativeModulesProxy` in favor of another solution introduced in [#15847](https://github.com/expo/expo/pull/15847). ([#16825](https://github.com/expo/expo/pull/16825) by [@tsapeta](https://github.com/tsapeta))

## 0.7.0 — 2022-01-26

### 🎉 New features

- Allow accessing `RCTBridge` from the modules on iOS. ([#15816](https://github.com/expo/expo/pull/15816) by [@tsapeta](https://github.com/tsapeta))
- Added support for native callbacks through the view props in Sweet API on iOS. ([#15731](https://github.com/expo/expo/pull/15731) by [@tsapeta](https://github.com/tsapeta))
- Added support for native callbacks through the view props in Sweet API on Android. ([#15743](https://github.com/expo/expo/pull/15743) by [@lukmccall](https://github.com/lukmccall))
- The `ModuleDefinition` will use class name if the `name` component wasn't provided in Sweet API on Android. ([#15738](https://github.com/expo/expo/pull/15738) by [@lukmccall](https://github.com/lukmccall))
- Added `onViewDestroys` component to the `ViewManager` in Sweet API on Android. ([#15740](https://github.com/expo/expo/pull/15740) by [@lukmccall](https://github.com/lukmccall))
- Added shortened `constants` component that takes `vargs Pair<String, Any?>` as an argument in Sweet API on Android. ([#15742](https://github.com/expo/expo/pull/15742) by [@lukmccall](https://github.com/lukmccall))
- Introduced the concept of chainable exceptions in Sweet API on iOS. ([#15813](https://github.com/expo/expo/pull/15813) by [@tsapeta](https://github.com/tsapeta))
- Sweet function closures can throw errors on iOS. ([#15849](https://github.com/expo/expo/pull/15849) by [@tsapeta](https://github.com/tsapeta))
- Add `requireNativeModule` function to replace accessing native modules from `NativeModulesProxy`. ([#15848](https://github.com/expo/expo/pull/15848) by [@tsapeta](https://github.com/tsapeta))
- Implemented basic functionality of JSI host object to replace `NativeModulesProxy` on iOS. ([#15847](https://github.com/expo/expo/pull/15847) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- It's no longer possible to directly call methods from the `ModuleDefinition` in the `ViewManagers` on Android. ([#15741](https://github.com/expo/expo/pull/15741) by [@lukmccall](https://github.com/lukmccall))
- Fix compatibility with react-native 0.66. ([#15914](https://github.com/expo/expo/pull/15914) by [@kudo](https://github.com/kudo))
- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

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
