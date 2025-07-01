# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 18.1.6 — 2025-07-01

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 18.1.5 — 2025-05-08

### 🐛 Bug fixes

- [Android] Fix `shouldUseForegroundService` being always `true`. ([#35875](https://github.com/expo/expo/pull/35875) by [@filipef101](https://github.com/filipef101))

## 18.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 18.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 18.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 18.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 18.1.0 — 2025-04-04

### 🐛 Bug fixes

- [Android] Add missing ProGuard rule to fix task consumer failed ([#34098](https://github.com/expo/expo/pull/34098) by [@cornejobarraza](https://github.com/cornejobarraza))
- [iOS] `startLocationUpdatesAsync` should not require background permissions ([#33617](https://github.com/expo/expo/pull/33617) by [@andrejpavlovic](https://github.com/andrejpavlovic)

### 💡 Others

- On Android, remove dependency on `smart-location-lib`. ([#33609](https://github.com/expo/expo/pull/33609) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [Android] Added missing dependency. ([#35822](https://github.com/expo/expo/pull/35822) by [@lukmccall](https://github.com/lukmccall))

## 18.0.10 - 2025-04-01

### 🐛 Bug fixes

- [iOS] Fixed issue with some permission request flows resolving too soon on iOS. ([#35693](https://github.com/expo/expo/pull/35693) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Remove restarting all services when CLLocationManager reports an error ([#35478](https://github.com/expo/expo/pull/35478) by [@chrfalch](https://github.com/chrfalch))

## 18.0.9 - 2025-03-31

_This version does not introduce any user-facing changes._

## 18.0.8 - 2025-03-14

### 💡 Others

- On iOS, added setting the scope value as per our documentation. ([#35452](https://github.com/expo/expo/pull/35452) by [@chrfalch](https://github.com/chrfalch))

## 18.0.7 - 2025-02-19

### 🐛 Bug fixes

- [iOS] Added guards to avoid task options to crash the app. ([#35477](https://github.com/expo/expo/pull/35477) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Added error handler to the streaming location/heading methods since these can fail while streaming ([#35004](https://github.com/expo/expo/pull/35004) by [@chrfalch](https://github.com/chrfalch))

## 18.0.6 - 2025-02-10

### 🐛 Bug fixes

- [Android] Use less specific exception in catch block of `resolveUserSettingsForRequest`. ([#34784](https://github.com/expo/expo/pull/34784) by [@alanjhughes](https://github.com/alanjhughes))

## 18.0.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 18.0.4 - 2024-12-10

_This version does not introduce any user-facing changes._

## 18.0.3 - 2024-11-29

_This version does not introduce any user-facing changes._

## 18.0.2 — 2024-11-19

### 🐛 Bug fixes

- Fixed NoClassDefFoundError for `Landroid/support/v4/app/ActivityCompat;`. ([#33088](https://github.com/expo/expo/pull/33088) by [@kudo](https://github.com/kudo))

## 18.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 18.0.0 — 2024-10-22

### 🛠 Breaking changes

- Remove deprecated code: geocoding using Google Maps API, old permission methods and related types. ([#29961](https://github.com/expo/expo/pull/29961) by [@Simek](https://github.com/Simek))
- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840), [#30867](https://github.com/expo/expo/pull/30867) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] Migrated the native module to Swift. ([#30388](https://github.com/expo/expo/pull/30388) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- On `iOS`, fix an issue where if the user selects "Allow Once" for location permissions, we needed to request background permissions twice because the first time had effect. ([#29272](https://github.com/expo/expo/pull/29272) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Added warning when using background location in Expo Go. ([#31461](https://github.com/expo/expo/pull/31461) by [@chrfalch](https://github.com/chrfalch))
- Keep using the legacy event emitter as the module is not fully migrated to Expo Modules API. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Rework package exports. ([#29953](https://github.com/expo/expo/pull/29953) by [@Simek](https://github.com/Simek))
- Updated documentation for default LocationAccuracy ([#31066](https://github.com/expo/expo/pull/31066) by [@johnculviner](https://github.com/johnculviner))

## 17.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 17.0.0 — 2024-04-18

### 🛠 Breaking changes

- [Web] `getPermissionsAsync` no longer prompts the user for permission instead we use the new browser API `navigator.permissions.query` to check the permission status. ([#26836](https://github.com/expo/expo/pull/26837) by [@hems](https://github.com/hems))

### 🎉 New features

- Add ability to disable permissions in config plugin by passing `false` instead of permission messages. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
- Fixed unit test errors. ([#28208](https://github.com/expo/expo/pull/28208) by [@kudo](https://github.com/kudo))

## 16.5.5 - 2024-02-29

_This version does not introduce any user-facing changes._

## 16.5.4 - 2024-02-27

### 🎉 New features

- [Android] Make foreground service permission opt-in with `isAndroidForegroundServiceEnabled` config plugin option [#27265](https://github.com/expo/expo/pull/27265) by [@brentvatne](https://github.com/brentvatne))
- [Android] Enable foreground service by default when background location is enabled [#27359](https://github.com/expo/expo/pull/27359) by [@brentvatne](https://github.com/brentvatne))

## 16.5.3 - 2024-02-06

### 🐛 Bug fixes

- [Android] Fixed: `NullPointerException: it must not be null`. ([#26688](https://github.com/expo/expo/pull/26688) by [@lukmccall](https://github.com/lukmccall))
- On `Android`, prevent location service from starting when permission is not in the manifest. ([#27355](https://github.com/expo/expo/pull/27355) by [@alanjhughes](https://github.com/alanjhughes))

## 16.5.2 - 2024-01-10

### 🎉 New features

- [Android] Added `formattedAddress` to the `LocationGeocodedAddress`. ([#26342](https://github.com/expo/expo/pull/26342) by [@whysetiawan](https://github.com/whysetiawan) & [@lukmccall](https://github.com/lukmccall)) ([#26342](https://github.com/expo/expo/pull/26342) by [@whysetiawan](https://github.com/whysetiawan), [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- [Android] Fix the module requiring the `expo-task-manager` module for methods that don't use it. ([#26200](https://github.com/expo/expo/pull/26200) by [@behenate](https://github.com/behenate))

## 16.5.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 16.5.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [Android] Moved to the new Modules API. ([#24737](https://github.com/expo/expo/pull/24737) by [@behenate](https://github.com/behenate))
- Remove `unimodule.json` in favour of `expo-module.config.json`. ([#25100](https://github.com/expo/expo/pull/25100) by [@reichhartd](https://github.com/reichhartd))

### 📚 3rd party library updates

- Updated `com.google.android.gms:play-services-location` to `21.0.1`. ([#25028](https://github.com/expo/expo/pull/25028) by [@behenate](https://github.com/behenate))

## 16.4.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 16.3.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 16.2.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 16.2.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 16.1.0 - 2023-07-13

### 🐛 Bug fixes

- Downgrade play-services-location to 20.0.0 to support react-native-maps. ([#23501](https://github.com/expo/expo/pull/23501) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 16.0.0 — 2023-06-21

_This version does not introduce any user-facing changes._

## 15.3.0 — 2023-06-13

### 📚 3rd party library updates

- Updated `com.google.android.gms:play-services-location` to `21.0.1` and `io.nlopez.smartlocation:library` to `3.3.3` ([#22468](https://github.com/expo/expo/pull/22468) by [@josephyanks](https://github.com/josephyanks))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

- On Android, removed use of deprecated `LocationRequest` constructor and replaced with `LocationRequest.Builder`. ([#22653](https://github.com/expo/expo/pull/22653) by [@alanjhughes](https://github.com/alanjhughes))
- Removed the Geocoding API service. ([#22830](https://github.com/expo/expo/pull/22830) by [@alanjhughes](https://github.com/alanjhughes))

## 15.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 15.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 15.1.0 — 2023-02-03

### 🐛 Bug fixes

- Removed strict null checks for expo location and avoid crash on android. ([#20792](https://github.com/expo/expo/pull/20792) by [@jayshah123](https://github.com/jayshah123) and [@forki](https://github.com/forki))
- Export types with type-only annotation to fix build when using `isolatedModules` flag. ([#20239](https://github.com/expo/expo/pull/20239) by [@zakharchenkoAndrii](https://github.com/zakharchenkoAndrii))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 15.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 15.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed `trueHeading` is sometimes bigger then 360 on Android. ([#19629](https://github.com/expo/expo/pull/19629) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 14.3.0 — 2022-07-07

### 🐛 Bug fixes

- Fixed Android 12+ runtime crash caused by `PendingIntent` misconfiguration. ([#17333](https://github.com/expo/expo/pull/17333) by [@kudo](https://github.com/kudo))

## 14.2.1 — 2022-04-20

_This version does not introduce any user-facing changes._

## 14.2.0 — 2022-04-18

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))
- Fix LocationObject type ([#17070](https://github.com/expo/expo/pull/17070) by [@rakeshpetit](https://github.com/rakeshpetit))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 14.1.0 — 2022-01-26

### 🐛 Bug fixes

- Allow location to work on Android with only coarse location permission. All apps do not require fine/precise location permission, but in past Expo was enforcing fine/precise even if you only needed coarse level location. ([#15760](https://github.com/expo/expo/pull/15760) by [@Noitidart](https://github.com/Noitidart))

## Unpublished

### 🛠 Breaking changes

- Add an option to whether kill or keep the foreground service when app is killed on Android. ([#15633](https://github.com/expo/expo/pull/15633) by [@islamouzou](https://github.com/islamouzou))
- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

## 14.0.2 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 14.0.1 — 2021-12-15

_This version does not introduce any user-facing changes._

## 14.0.0 — 2021-12-03

### 🛠 Breaking changes

- Remove deprecated `setApiKey` method. ([#14672](https://github.com/expo/expo/pull/14672) by [@Simek](https://github.com/Simek))

### 🎉 New features

- Added steetNumber to `reverseGeocodeAsync` for iOS ([#13556](https://github.com/expo/expo/pull/13556) by [@chrisdrackett](https://github.com/chrisdrackett))

### 🐛 Bug fixes

- Call `jobService.jobFinished` for the finished geofencing jobs. ([#14786](https://github.com/expo/expo/pull/14786) by [@mdmitry01](https://github.com/mdmitry01))
- Check for null value of `mLocationClient` to prevent a crash ([#15023](https://github.com/expo/expo/pull/15023) by [@zakharchenkoAndrii](https://github.com/zakharchenkoAndrii))

### 💡 Others

- Extract nested `foregroundService` object from `LocationTaskOptions` type to the separate type `LocationTaskServiceOptions`. ([#14672](https://github.com/expo/expo/pull/14672) by [@Simek](https://github.com/Simek))

## 13.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 13.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- [plugin] Added `isIosBackgroundLocationEnabled` to enable the background location UIMode ([#14142](https://github.com/expo/expo/pull/14142) by [@EvanBacon](https://github.com/EvanBacon))
- Use stable manifest ID where applicable. ([#12964](https://github.com/expo/expo/pull/12964) by [@wschurman](https://github.com/wschurman))
- Add useForegroundPermissions and useBackgroundPermissions hooks from modules factory. ([#13860](https://github.com/expo/expo/pull/13860) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fixed `Location.getCurrentPositionAsync` throwing `Location provider is unavailable.` error. ([#14281](https://github.com/expo/expo/pull/14281) by [@m1st4ke](https://github.com/m1st4ke))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))
- Update error message for `LocationUnavailableException` on Android. ([#14539](https://github.com/expo/expo/pull/14539) by [@kylerjensen](https://github.com/kylerjensen))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 12.1.0 — 2021-06-16

### 🐛 Bug fixes

- Fixed `startLocationUpdatesAsync` requiring the background location permission even if was used when the app is in the foreground on iOS. ([#12594](https://github.com/expo/expo/pull/12594) by [@lukmccall](https://github.com/lukmccall))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

## 12.0.4 — 2021-04-13

_This version does not introduce any user-facing changes._

## 12.0.3 — 2021-04-09

### 🐛 Bug fixes

- Add support for user-initiated background tracking without background permission ([#12456](https://github.com/expo/expo/pull/12456) by [@bycedric](https://github.com/bycedric))

## 12.0.2 — 2021-03-29

### 🐛 Bug fixes

- Lock the unimodules-permissions-interface dependency to the same version in react-native-unimodules

## 12.0.1 — 2021-03-26

### 🐛 Bug fixes

- Add missing unimodules-permissions-interface dependency

## 12.0.0 — 2021-03-10

### 🛠 Breaking changes

- Splitting location permissions into `Foreground` and `Background` permissions. ([#12063](https://github.com/expo/expo/pull/12063) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove sticky notification on service stop on Android. ([#11775](https://github.com/expo/expo/pull/11775) by [@zaguiini](https://github.com/zaguiini))
- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 11.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed background location permission check on Android. ([#11399](https://github.com/expo/expo/pull/11399) by [@peterdn](https://github.com/peterdn))

## 10.0.0 — 2020-11-17

### 🛠 Breaking changes

- Make background location an opt-in permission on Android. ([#10989](https://github.com/expo/expo/pull/10989) by [@bycedric](https://github.com/bycedric))

## 9.0.1 — 2020-10-02

### 🐛 Bug fixes

- Redeliver intent when restarting task service. ([#10410](https://github.com/expo/expo/pull/10410) by [@byCedric](https://github.com/byCedric))

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Add `scope` field in returned value to indicate whether background permissions are granted. Add `android.accuracy` field to determine whether `coarse` or `fine` location permission is granted. ([#9446](https://github.com/expo/expo/pull/9446) by [@mczernek](https://github.com/mczernek))
- `getLastKnownPositionAsync` no longer rejects when the last known location is not available – now it returns `null`. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Removed the deprecated `enableHighAccuracy` option of `getCurrentPositionAsync`. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Removed `maximumAge` and `timeout` options from `getCurrentPositionAsync` – it's been Android only and the same behavior can be achieved on all platforms on the JavaScript side. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Made type and enum names more consistent and in line with our standards — they all are now prefixed by `Location`. The most common ones are still accessible without the prefix, but it's not the recommended way. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- `geocodeAsync` and `reverseGeocodeAsync` no longer falls back to Google Maps API on Android. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added missing `altitudeAccuracy` to the location object on Android (requires at least Android 8.0). ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Improved support for Web — added missing methods for requesting permissions and getting last known position. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Added `maxAge` and `requiredAccuracy` options to `getLastKnownPositionAsync`. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Google Maps Geocoding API can now be used on all platforms with the new `useGoogleMaps` option. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))
- Added `district`, `subregion` and `timezone` values to reverse-geocoded address object. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed different types being used on Web platform. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- `getLastKnownPositionAsync` no longer requests for the current location on iOS and just returns the last known one as it should be. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Fixed `getCurrentPositionAsync` not resolving on Android when the lowest accuracy is used. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
- Fixed `LocationGeocodedAddress` type to reflect the possibility of receiving `null` values. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))

## 8.3.0 — 2020-07-16

### 🐛 Bug fixes

- Added some safety checks to prevent `NullPointerExceptions` in background location on Android. ([#8864](https://github.com/expo/expo/pull/8864) by [@mczernek](https://github.com/mczernek))
- Add `isoCountryCode` to `Address` type and reverse lookup. ([#8913](https://github.com/expo/expo/pull/8913) by [@bycedric](https://github.com/bycedric))
- Fix geocoding requests not resolving/rejecting on iOS when the app is in the background or inactive state. It makes it possible to use geocoding in such app states, however it's still discouraged. ([#9178](https://github.com/expo/expo/pull/9178) by [@tsapeta](https://github.com/tsapeta))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
