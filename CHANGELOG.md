# Changelog

This is the log of notable changes to the Expo client that are developer-facing.
Package-specific changes not released in any SDK will be added here just before the release. Until then, you can find them in changelogs of the individual packages (see [packages](./packages) directory).

## Unpublished

### 📚 3rd party library updates

- Updated `react-native-gesture-handler` from `2.9.0` to `2.10.1`. ([#22621](https://github.com/expo/expo/pull/22621) by [@kudo](https://github.com/kudo))

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed a regression in `expo-print` after refactoring to Swift. ([#22997](https://github.com/expo/expo/pull/22997) by [@mroswald](https://github.com/mroswald), [@behenate](https://github.com/behenate))

### ⚠️ Notices

- Removed the `Remote JS debugger` option from Expo Go menu when using SDK 49 or above. ([#22027](https://github.com/expo/expo/pull/22027) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 48.0.0 — 2023-02-09

### 📚 3rd party library updates

- Updated `@stripe/stripe-react-native` from `0.19.0` to `0.23.3`. ([#20964](https://github.com/expo/expo/pull/20964) by [@aleqsio](https://github.com/aleqsio), [#21117](https://github.com/expo/expo/pull/21117) by [@kudo](https://github.com/kudo))
- Updated `react-native-webview` from `11.23.1` to `11.26.0`. ([#20933](https://github.com/expo/expo/pull/20933) by [@aleqsio](https://github.com/aleqsio))
- Updated `react-native-gesture-handler` from `2.8.0` to `2.9.0`. ([#20930](https://github.com/expo/expo/pull/20930) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-shared-element` from `0.8.4` to `0.8.7`. ([#20593](https://github.com/expo/expo/pull/20593) by [@ijzerenhein](https://github.com/ijzerenhein))
- Updated `@react-native-async-storage/async-storage` from `1.17.3` to `1.17.11`. ([#20780](https://github.com/expo/expo/pull/20780) by [@kudo](https://github.com/kudo))
- Updated `react-native-reanimated` from `2.12.0` to `2.14.4`. ([#20798](https://github.com/expo/expo/pull/20798) by [@kudo](https://github.com/kudo), [#20990](https://github.com/expo/expo/pull/20990) by [@tsapeta](https://github.com/tsapeta))
- Updated `@shopify/react-native-skia` from `0.1.157` to `0.1.172`. ([#20857](https://github.com/expo/expo/pull/20857), [#21014](https://github.com/expo/expo/pull/21014) by [@kudo](https://github.com/kudo))
- Updated `react-native-safe-area-context` from `4.4.1` to `4.5.0`. ([#20899](https://github.com/expo/expo/pull/20899) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Updated `react-native-screens` from `3.18.0` to `3.20.0`. ([#20938](https://github.com/expo/expo/pull/20938) by [@lukmccall](https://github.com/lukmccall), [#21186](https://github.com/expo/expo/pull/21186) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-pager-view` from `6.0.1` to `6.1.2`. ([#20932](https://github.com/expo/expo/pull/20932) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Updated `@react-native-community/slider` from `4.2.4` to `4.4.2`. ([#20903](https://github.com/expo/expo/pull/20903) by [@gabrieldonadel](https://github.com/gabrieldonadel), [#21055](https://github.com/expo/expo/pull/21055) by [@kudo](https://github.com/kudo))
- Updated `react-native-shared-element` from `0.8.7` to `0.8.8`. ([#20929](https://github.com/expo/expo/pull/20929) by [@byCedric](https://github.com/byCedric))
- Updated `@react-native-community/datetimepicker` from `6.5.2` to `6.7.3`. ([#20926](https://github.com/expo/expo/pull/20926) by [@byCedric](https://github.com/byCedric))
- Updated `@shopify/flash-list` from `1.3.1` to `1.4.0`. ([#20927](https://github.com/expo/expo/pull/20927) by [@lukmccall](https://github.com/lukmccall))

### 🛠 Breaking changes

- **`expo-contacts`**
  - Remove deprecated and legacy contact fields constants. ([#20269](https://github.com/expo/expo/pull/20269) by [@Simek](https://github.com/Simek))
- **`expo-keep-awake`**
  - `KeepAwake.activateKeepAwake` has been deprecated in favor of `KeepAwake.activateKeepAwakeAsync`. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-linking`**
  - Removed the deprecated `Linking.removeEventListener`. ([#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

### 🎉 New features

- **`expo-apple-authentication`**
  - Migrated to Expo Modules API and Swift. ([#20600](https://github.com/expo/expo/pull/20600) by [@tsapeta](https://github.com/tsapeta))
  - Added support for Fabric. ([#20600](https://github.com/expo/expo/pull/20600) by [@tsapeta](https://github.com/tsapeta))
- **`expo-av`**
  - Added `PosterComponent` prop to `Video` component. ([#19625](https://github.com/expo/expo/pull/19625) by [@youedd](https://github.com/youedd)
- **`expo-barcode-scanner`**
  - Native module for barcode scanner view is now written in Swift and Kotlin using the new API. ([#20441](https://github.com/expo/expo/pull/20441) and ([#20668](https://github.com/expo/expo/pull/20668) by [@alanhughes](https://github.com/alanjhughes)) ([#20441](https://github.com/expo/expo/pull/20441), [#20668](https://github.com/expo/expo/pull/20668) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-blur`**
  - Migrated iOS codebase to Swift and the new Expo modules API. ([#19786](https://github.com/expo/expo/pull/19786) by [@tsapeta](https://github.com/tsapeta))
- **`expo-brightness`**
  - Migrated iOS codebase to use the new Expo modules API. ([#20316](https://github.com/expo/expo/pull/20316) by [@alanhughes](https://github.com/alanjhughes)) ([#20316](https://github.com/expo/expo/pull/20316) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-constants`**
  - Migrated Android implementation to Expo Modules API. ([#19974](https://github.com/expo/expo/pull/19974) by [@alanhughes](https://github.com/alanjhughes)) ([#19974](https://github.com/expo/expo/pull/19974) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-crypto`**
  - Added a `randomUUID` method to get a random UUIDv4 string. ([#20274](https://github.com/expo/expo/pull/20274) by [@aleqsio](https://github.com/aleqsio))
  - Added a `getRandomValues` method to fill typed arrays. ([#20257](https://github.com/expo/expo/pull/20257) by [@aleqsio](https://github.com/aleqsio))
  - Ported over `getRandomBytes`, `getRandomBytesAsync` methods from `expo-random`. ([#20217](https://github.com/expo/expo/pull/20217) by [@aleqsio](https://github.com/aleqsio))
  - Added a `digest` method to get a cryptographic digest of a typed array. ([#20886](https://github.com/expo/expo/pull/20886) by [@aleqsio](https://github.com/aleqsio))
- **`expo-device`**
  - Migrated Android codebase to use the new Expo modules API. ([#20118](https://github.com/expo/expo/pull/20118) by [@alanhughes](https://github.com/alanjhughes)) ([#20118](https://github.com/expo/expo/pull/20118) by [@alanjhughes](https://github.com/alanjhughes))
  - Native module on iOS is now written in Swift using the Sweet API. ([#19526](https://github.com/expo/expo/pull/19526) by [@fobos531](https://github.com/fobos531))
- **`expo-document-picker`**
  - Migrated to Expo Modules API. ([#20336](https://github.com/expo/expo/pull/20336) by [@alanhughes](https://github.com/alanjhughes)) ([#20336](https://github.com/expo/expo/pull/20336) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-gl`**
  - Migrated the view manager to the new Expo modules API and thus added support for Fabric. ([#19859](https://github.com/expo/expo/pull/19859) by [@tsapeta](https://github.com/tsapeta))
  - Migrated the view manager to the new Expo modules API and thus added support for Fabric on Android. ([#20749](https://github.com/expo/expo/pull/20749) by [@lukmccall](https://github.com/lukmccall))
- **`expo-haptics`**
  - Migrated Android codebase to use the new Expo modules API. ([#20016](https://github.com/expo/expo/pull/20016) by [@alanhughes](https://github.com/alanjhughes)) ([#20016](https://github.com/expo/expo/pull/20016) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-keep-awake`**
  - Added web support. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))
  - Added `KeepAwake.isAvailableAsync` which returns false on certain web browsers. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))
  - Added `KeepAwake.addListener` to observe state changes on web. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-intent-launcher`**
  - Migrated to Expo Modules API. ([#20327](https://github.com/expo/expo/pull/20327) by [@alanhughes](https://github.com/alanjhughes)) ([#20327](https://github.com/expo/expo/pull/20327) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-local-authentication`**
  - Native module on iOS is now written in Swift using the Sweet API. ([#19980](https://github.com/expo/expo/pull/19980) by [@fobos531](https://github.com/fobos531))
- **`expo-image-picker`**
  - Add support for [granular permissions](https://developer.android.com/about/versions/13/behavior-changes-13) on Android 13. ([#20908](https://github.com/expo/expo/pull/20908) by [@alanhughes](https://github.com/alanjhughes)) ([#20908](https://github.com/expo/expo/pull/20908) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-media-library`**
  - Migrated Android codebase to use the new Expo modules API. ([#20232](https://github.com/expo/expo/pull/20232) by [@alanhughes](https://github.com/alanjhughes)) ([#20232](https://github.com/expo/expo/pull/20232) by [@alanjhughes](https://github.com/alanjhughes))
  - Add support for [granular permissions](https://developer.android.com/about/versions/13/behavior-changes-13) on Android 13. ([#20907](https://github.com/expo/expo/pull/20907) by [@alanhughes](https://github.com/alanjhughes)) ([#20907](https://github.com/expo/expo/pull/20907) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-modules-core`**
  - Added TS definitions for `TypedArray` and additional union types for Int, Uint and Float TypedArrays. ([#20257](https://github.com/expo/expo/pull/20257) by [@aleqsio](https://github.com/aleqsio))
  - Added a new `executeOnJavaScriptThread` method to `appContext` to allow for running code blocks on the JS thread. ([#20161](https://github.com/expo/expo/pull/20161) by [@aleqsio](https://github.com/aleqsio))
  - Added the `Exceptions.MissingActivity` on Android. ([#20174](https://github.com/expo/expo/pull/20174) by [@lukmccall](https://github.com/lukmccall))
  - Trailing optional arguments can be skipped when calling native functions from JavaScript on iOS. ([#20234](https://github.com/expo/expo/pull/20234) by [@tsapeta](https://github.com/tsapeta))
  - `Events` component can now be initialized with an array of event names (not only variadic arguments). ([#20590](https://github.com/expo/expo/pull/20590) by [@tsapeta](https://github.com/tsapeta))
  - `Property` component can now take the native shared object instance as the first argument. ([#20608](https://github.com/expo/expo/pull/20608) by [@tsapeta](https://github.com/tsapeta))
  - Added support for referencing to `Property`'s owner properties using Swift key paths. ([#20610](https://github.com/expo/expo/pull/20610) by [@tsapeta](https://github.com/tsapeta))
  - Added support for concurrent (async/await) functions in Swift. ([#20645](https://github.com/expo/expo/pull/20645) by [@tsapeta](https://github.com/tsapeta))
  - [iOS] Added experimental support for building the function result from the object definition. ([#20623](https://github.com/expo/expo/pull/20623) by [@tsapeta](https://github.com/tsapeta))
  - View-related DSL functions do not require providing the view's type in function parameters on Android. ([#20751](https://github.com/expo/expo/pull/20751) by [@lukmccall](https://github.com/lukmccall))
  - Add support for the `Long` type as function parameters on Android. ([#20787](https://github.com/expo/expo/pull/20787) by [@lukmccall](https://github.com/lukmccall))
  - [Android] Added experimental support for building the function result from the object definition. ([#20864](https://github.com/expo/expo/pull/20864) by [@lukmccall](https://github.com/lukmccall))
  - Removed boost dependency which needs extra downloading on Android. ([#21000](https://github.com/expo/expo/pull/21000) by [@kudo](https://github.com/kudo))
- **`expo-network`**
  - Migrated to Expo Modules API. ([#20083](https://github.com/expo/expo/pull/20083) and [#20303](https://github.com/expo/expo/pull/20303) by [@alanhughes](https://github.com/alanjhughes)) ([#20083](https://github.com/expo/expo/pull/20083), [#20303](https://github.com/expo/expo/pull/20303) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-sharing`**
  - Migrated Android implementation to Expo Modules API. ([#20112](https://github.com/expo/expo/pull/20112) by [@alanhughes](https://github.com/alanjhughes)) ([#20112](https://github.com/expo/expo/pull/20112) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-sms`**
  - Migrated to Expo Modules API. ([#19996](https://github.com/expo/expo/pull/19996) and ([#19967](https://github.com/expo/expo/pull/19967) by [@alanhughes](https://github.com/alanjhughes)) ([#19996](https://github.com/expo/expo/pull/19996), [#19967](https://github.com/expo/expo/pull/19967) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-store-review`**
  - Migrated Android implementation to Expo Modules API. ([#19898](https://github.com/expo/expo/pull/19898) by [@alanhughes](https://github.com/alanjhughes)) ([#19898](https://github.com/expo/expo/pull/19898) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-speech`**
  - Added utterance word tracking support for iOS and Android. This allows the ability to highlight each word in an utterance. ([#20726](https://github.com/expo/expo/pull/20726) by [@gabrieljoelc](https://github.com/gabrieljoelc))
- **`expo-video-thumbnails`**
  - Native module on iOS is now written in Swift using the Sweet API. ([#19561](https://github.com/expo/expo/pull/19561) by [@fobos531](https://github.com/fobos531))
  - Migrated Android codebase to use the new Expo modules API. ([#20541](https://github.com/expo/expo/pull/20541) by [@alanhughes](https://github.com/alanjhughes)) ([#20541](https://github.com/expo/expo/pull/20541) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- **`expo-asset`**
  - Fix loading Metro web assets from origins other than `/`. ([#20258](https://github.com/expo/expo/pull/20258) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-av`**
  - Fixed error for duplicated META-INF files when building on Android. ([#20251](https://github.com/expo/expo/pull/20251) by [@kudo](https://github.com/kudo))
  - Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
  - Fixed crashes when ProGuard or R8 is enabled on Android. ([#20197](https://github.com/expo/expo/pull/20197) by [@lukmccall](https://github.com/lukmccall))
  - Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))
  - Fixed `HTMLMediaElement.play` and `HTMLMediaElement.pause` calls on the Web aren't properly awaited. ([#20439](https://github.com/expo/expo/pull/20439)) by [@zhigang1992](https://github.com/zhigang1992) ([#20439](https://github.com/expo/expo/pull/20439) by [@zhigang1992](https://github.com/zhigang1992))
  - Added support for React Native 0.71.x. ([#20799](https://github.com/expo/expo/pull/20799) [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo)) ([#20799](https://github.com/expo/expo/pull/20799), [#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))
  - Fixed JSI audio sampling buffer issues when using `SimpleExoPlayer` implementation on Android. ([#21055](https://github.com/expo/expo/pull/21055) by [@kudo](https://github.com/kudo))
- **`expo-barcode-scanner`**
  - Fix import issue on case-sensitive file systems ([#20141](https://github.com/expo/expo/pull/20141) by [@hirbod](https://github.com/hirbod))
- **`expo-blur`**
  - Add `-webkit-backdrop-filter` to support blurring on Safari. ([#21003](https://github.com/expo/expo/pull/21003) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-clipboard`**
  - Fixed clipboard listener is called twice on Android. ([#19723](https://github.com/expo/expo/pull/19723) by [@lukmccall](https://github.com/lukmccall))
  - Fixed clipboard listener can crash the application during initialization on Android. ([#19723](https://github.com/expo/expo/pull/19723) by [@lukmccall](https://github.com/lukmccall))
  - Fixed the `ImageFormat` or the `StringFormat` not working in the release builds on Android. ([#20155](https://github.com/expo/expo/pull/20155) by [@lukmccall](https://github.com/lukmccall))
- **`expo-constants`**
  - Fix the list of platform keys in expo-module.config.json ([#20017](https://github.com/expo/expo/pull/20017) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-camera`**
  - Fix import issue on case-sensitive file systems ([#20141](https://github.com/expo/expo/pull/20141) by [@hirbod](https://github.com/hirbod))
  - Fix path where simulator saves photos ([#20872](https://github.com/expo/expo/pull/20872) by [@pettomartino](https://github.com/pettomartino))
  - Fixed `Cannot set prop 'barCodeScannerSettings' on view 'class expo.modules.camera.ExpoCameraView'` on Android. ([#21033](https://github.com/expo/expo/pull/21033) by [@lukmccall](https://github.com/lukmccall))
- **`expo-file-system`**
  - Add utf-8 uri support on iOS. ([#21098](https://github.com/expo/expo/pull/21098) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **`expo-gl`**
  - Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
  - Fixed error for duplicated META-INF files when building on Android. ([#20251](https://github.com/expo/expo/pull/20251) by [@kudo](https://github.com/kudo))
  - Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))
- **`expo-haptics`**
  - Fixed rare crash on iOS when using Feedback Generator's API not on the main thread. ([#19819](https://github.com/expo/expo/pull/19819) by [@AntonGolikov](https://github.com/AntonGolikov))
- **`expo-image-picker`**
  - Fix incorrect asset type for videos on iOS. ([#19932](https://github.com/expo/expo/pull/19932) by [@tsapeta](https://github.com/tsapeta))
  - Fix support for animated GIFs on iOS. ([#20034](https://github.com/expo/expo/pull/20034) by [@barthap](https://github.com/barthap))
- **`expo-mail-composer`**
  - Fix `composeAsync` not resolving promise after sending/ discarding email. ([#20869](https://github.com/expo/expo/pull/20869) by [@keith-kurak](https://github.com/keith-kurak))
- **`expo-media-library`**
  - Renamed the module on iOS to match the name used on Android. ([#20283](https://github.com/expo/expo/pull/20283) by [@alanhughes](https://github.com/alanjhughes)) ([#20283](https://github.com/expo/expo/pull/20283) by [@alanjhughes](https://github.com/alanjhughes))
- **`expo-modules-core`**
  - Added a list of the acceptable enum values to the conversion error on Android. ([#19895](https://github.com/expo/expo/pull/19895) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `new NativeEventEmitter() was called with a non-null argument without the required addListener method.` warnings on Android with JSC. ([#19920](https://github.com/expo/expo/pull/19920) by [@kudo](https://github.com/kudo))
  - Fixed views are not correctly initialized after reloading on Android. ([#20063](https://github.com/expo/expo/pull/20063) by [@lukmccall](https://github.com/lukmccall))
  - Fixed threading crash issue when running with Hermes on iOS. ([#20506](https://github.com/expo/expo/pull/20506) by [@kudo](https://github.com/kudo))
  - Fixed build errors when testing on React Native nightly builds. ([#19805](https://github.com/expo/expo/pull/19805) by [@kudo](https://github.com/kudo))
  - Fixed failed resolution of 'java.nio.file.Path' on Android. ([#20037](https://github.com/expo/expo/pull/20037) by [@lukmccall](https://github.com/lukmccall))
  - Fixed libraries using the `ViewDefinitionBuilder` crashes when ProGuard or R8 is enabled on Android. ([#20197](https://github.com/expo/expo/pull/20197) by [@lukmccall](https://github.com/lukmccall))
  - Fixed Either types not supporting non-primitive types on iOS. ([#20247](https://github.com/expo/expo/pull/20247) by [@tsapeta](https://github.com/tsapeta))
  - Fixed Function not supporting certain arities on Android. ([#20419](https://github.com/expo/expo/pull/20419) by [@motiz88](https://github.com/motiz88))
  - Added React Native 0.71 support. ([#20470](https://github.com/expo/expo/pull/20470) by [@kudo](https://github.com/kudo))
  - Fixed the `SharedObject` initializer being inaccessible due to `internal` protection level. ([#20588](https://github.com/expo/expo/pull/20588) by [@tsapeta](https://github.com/tsapeta))
  - Fixed boost build error on Android. ([#20719](https://github.com/expo/expo/pull/20719) by [@kudo](https://github.com/kudo))
  - Fix view prop setter not being called when its new value is `null` or `undefined`. ([#20755](https://github.com/expo/expo/pull/20755) & [#20766](https://github.com/expo/expo/pull/20766) by [@tsapeta](https://github.com/tsapeta) & [@lukmccall](https://github.com/lukmccall)) ([#20755](https://github.com/expo/expo/pull/20755), [#20766](https://github.com/expo/expo/pull/20766) by [@tsapeta](https://github.com/tsapeta), [@lukmccall](https://github.com/lukmccall))
  - Fixed "Tried to register two views with the same name" error on fast refresh. ([#20788](https://github.com/expo/expo/pull/20788) by [@tsapeta](https://github.com/tsapeta))
  - Fix crash when reloading app while expo-av video is playing. ([#21118](https://github.com/expo/expo/pull/21118) by [@janicduplessis](https://github.com/janicduplessis))
- **`expo-location`**
  - Removed strict null checks for expo location and avoid crash on android. ([#20792](https://github.com/expo/expo/pull/20792) by [@jayshah123](https://github.com/jayshah123) and [@forki](https://github.com/forki)) ([#20792](https://github.com/expo/expo/pull/20792) by [@jayshah123](https://github.com/jayshah123), [@forki](https://github.com/forki))
  - Export types with type-only annotation to fix build when using `isolatedModules` flag. ([#20239](https://github.com/expo/expo/pull/20239) by [@zakharchenkoAndrii](https://github.com/zakharchenkoAndrii))
- **`expo-print`**
  - Fix `printAsync` not reflecting custom width/ height, `useMarkupFormatter` option preventing custom width/ height/ margin from being reflected. ([#18873](https://github.com/expo/expo/pull/20046) by [@keith-kurak](https://github.com/keith-kurak)) ([#20046](https://github.com/expo/expo/pull/20046) by)
- **`expo-sensors`**
  - Export types with type-only annotation to fix build when using `isolatedModules` flag. ([#20239](https://github.com/expo/expo/pull/20239) by [@zakharchenkoAndrii](https://github.com/zakharchenkoAndrii))
- **`expo-web-browser`**
  - Add missing peer dependency on `url` for web. ([#20708](https://github.com/expo/expo/pull/20708) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- **`expo-asset`**
  - Remove unused web features. ([#20258](https://github.com/expo/expo/pull/20258) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-application`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-auth-session`**
  - Removed usage of the deprecated `expo-random` package. ([#21063](https://github.com/expo/expo/pull/21063) by [@lukmccall](https://github.com/lukmccall))
- **`expo-background-fetch`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-av`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-barcode-scanner`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-branch`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-brightness`**
  - Deprecate `useSystemBrightnessAsync` and add it as renamed `restoreSystemBrightnessAsync` method to avoid violating Rules of Hooks. ([#19701](https://github.com/expo/expo/pull/19701) by [@Simek](https://github.com/Simek))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-cellular`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-calendar`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-clipboard`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-constants`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-contacts`**
  - Simplify exported types. ([#20269](https://github.com/expo/expo/pull/20269) by [@Simek](https://github.com/Simek))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-crypto`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-battery`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-device`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-document-picker`**
  - Avoid dependency on `uuid`. ([#20477](https://github.com/expo/expo/pull/20477) by [@LinusU](https://github.com/LinusU))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-camera`**
  - Use correct type for `videoStabilizationMode` option. ([#20130](https://github.com/expo/expo/pull/20130) by [@simek](https://github.com/simek))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-error-recovery`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-file-system`**
  - Extract nested object definitions to the separate types, which adds: `DeletingOptions`, `InfoOptions`, `RelocatingOptions` and `MakeDirectoryOptions` types. ([#20103](https://github.com/expo/expo/pull/20103) by [@Simek](https://github.com/Simek))
  - Simplify the way in which types are exported from the package. ([#20103](https://github.com/expo/expo/pull/20103) by [@Simek](https://github.com/Simek))
  - Rename `UploadProgressData` `totalByteSent` field to `totalBytesSent`. ([#20804](https://github.com/expo/expo/pull/20804) by [@gabrieldonadel](https://github.com/gabrieldonadel))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-font`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-face-detector`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-gl`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-haptics`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-image-manipulator`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-image-loader`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-keep-awake`**
  - Define `KeepAwakeOptions` type, update the doc comments. ([#20489](https://github.com/expo/expo/pull/20489) by [@Simek](https://github.com/Simek))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-linear-gradient`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-intent-launcher`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-local-authentication`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-linking`**
  - Fix link in README that was incorrectly pointing to to expo-asset. ([#20616](https://github.com/expo/expo/pull/20616) by [@stereoplegic](https://github.com/stereoplegic))
- **`expo-image-picker`**
  - Avoid dependency on `uuid`. ([#20476](https://github.com/expo/expo/pull/20476) by [@LinusU](https://github.com/LinusU))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-localization`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-mail-composer`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-media-library`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-modules-core`**
  - Exposed coroutines related packages on Android. ([#19896](https://github.com/expo/expo/pull/19896) by [@lukmccall](https://github.com/lukmccall))
  - Rephrased the message of `ArgumentCastException` to use ordinal numbers. ([#19912](https://github.com/expo/expo/pull/19912) by [@tsapeta](https://github.com/tsapeta))
  - [iOS] Make `Enumerable` protocol implement `CaseIterable` to get rid of operating on unsafe pointers. ([#20640](https://github.com/expo/expo/pull/20640) by [@tsapeta](https://github.com/tsapeta))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-location`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-network`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-print`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-random`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-permissions`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-screen-capture`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-notifications`**
  - Update `getExpoPushTokenAsync` to make `projectId` required. ([#20833](https://github.com/expo/expo/pull/20833) by [@gabrieldonadel](https://github.com/gabrieldonadel))
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
  - Add JSDoc comments, perform type changes related to documentation autogeneration. ([#21002](https://github.com/expo/expo/pull/21002) by [@Simek](https://github.com/Simek))
  - Export `getExpoPushTokenAsync` parameter type. ([#21104](https://github.com/expo/expo/pull/21104) by [@Simek](https://github.com/Simek))
- **`expo-sharing`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-screen-orientation`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-sms`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-sensors`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-store-review`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-secure-store`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-speech`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-sqlite`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-task-manager`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-video-thumbnails`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`expo-web-browser`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- **`unimodules-app-loader`**
  - On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

### ⚠️ Notices

- **`expo-image-picker`**
  - Removed deprecated fields from pick result type and deprecated `UIImagePickerPresentationStyle` enum values. ([#21078](https://github.com/expo/expo/pull/21078) by [@Simek](https://github.com/Simek))
- **`expo-random`**
  - Deprecate the library in favor of expo-crypto. ([#20217](https://github.com/expo/expo/pull/20217) by [@aleqsio](https://github.com/aleqsio))

## 47.0.0 — 2022-10-28

For changelog entries prior to SDK 47, refer to: https://github.com/expo/expo/blob/ff35557463c0db1cf8683939d752c59baf127f21/CHANGELOG.md#L323
