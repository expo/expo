# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 16.0.3 — 2024-11-22

_This version does not introduce any user-facing changes._

## 16.0.2 — 2024-11-14

_This version does not introduce any user-facing changes._

## 16.0.1 — 2024-11-04

### 🐛 Bug fixes

- Fix incorrect width/height reported with EXIF tags 5 and 7 ([#32534](https://github.com/expo/expo/pull/32534) by [@gaearon](https://github.com/gaearon))

## 16.0.0 — 2024-10-22

### 🛠 Breaking changes

- Remove `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO` permissions. ([#31902](https://github.com/expo/expo/pull/31902) by [@aleqsio](https://github.com/aleqsio))
- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))
- The default value for `quality` option has been changed from `0.2` to `1.0` for better performance and to match the most common expectation. ([#30896](https://github.com/expo/expo/pull/30896) by [@tsapeta](https://github.com/tsapeta))
- `ImagePicker.MediaTypeOptions` have been deprecated. Use a single MediaType or an array of MediaTypes instead. ([#30957](https://github.com/expo/expo/pull/30957) by [@behenate](https://github.com/behenate))

### 🎉 New features

- [web] Include `file` object from input for server uploads. ([#31788](https://github.com/expo/expo/pull/31788) by [@EvanBacon](https://github.com/EvanBacon))
- [iOS] Add support for picking live photos from the library. ([#30957](https://github.com/expo/expo/pull/30957) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [iOS] Provide more image metadata in the result object. ([#29648](https://github.com/expo/expo/pull/29648) by [@vonovak](https://github.com/vonovak))
- Only import from `expo/config-plugins` to follow proper dependency chains. ([#30499](https://github.com/expo/expo/pull/30499) by [@byCedric](https://github.com/byCedric))
- [web] Return missing values from video selection. ([#30966](https://github.com/expo/expo/pull/30966) by [@entiendoNull](https://github.com/entiendoNull))
- [Android] Fix permissions on devices running Android 11 and 12. ([#31396](https://github.com/expo/expo/pull/31396) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Refactored the code on iOS and made promise resolution faster. ([#30896](https://github.com/expo/expo/pull/30896) by [@tsapeta](https://github.com/tsapeta))

## 15.0.7 - 2024-07-03

### 🐛 Bug fixes

- [iOS] Fix an issue where the app will crash when using the popover presentation style on iPad. ([#29892](https://github.com/expo/expo/pull/29892) by [@alanjhughes](https://github.com/alanjhughes))

## 15.0.6 - 2024-06-20

### 🐛 Bug fixes

- Support removing microphone permissions through config plugin. ([#29749](https://github.com/expo/expo/pull/29749) by [@alanjhughes](https://github.com/alanjhughes))

## 15.0.5 — 2024-05-15

### 🐛 Bug fixes

- [Android] Add support for granular permissions. ([#28897](https://github.com/expo/expo/pull/28897) by [@lukmccall](https://github.com/lukmccall))

## 15.0.4 — 2024-05-01

_This version does not introduce any user-facing changes._

## 15.0.3 — 2024-04-29

### 🎉 New features

- Add new `legacy` option to `ImagePickerOptions` to allow using the legacy image picker on android. ([#28514](https://github.com/expo/expo/pull/28514) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed type exports for isolatedModules option in typescript ([#28499](https://github.com/expo/expo/pull/28499) by [@megacherry](https://github.com/megacherry))
- On Android, fixed an issue where multiple pickers could be opened, causing a crash. ([#28509](https://github.com/expo/expo/pull/28509) by [@haileyok](https://github.com/haileyok))

## 15.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 15.0.1 — 2024-04-22

### 🐛 Bug fixes

- Fixed an issue where cropped images were not returning file size and file name on Android. ([#28352](https://github.com/expo/expo/pull/28352) by [@fobos531](https://github.com/fobos531))

## 15.0.0 — 2024-04-18

### 🎉 New features

- Add ability to disable permissions in config plugin by passing `false` instead of permission messages. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- On Android `fileSize` was named `filesize` which did not match the docs & typescript definition. ([#27293](https://github.com/expo/expo/pull/27293) by [@WookieFPV](https://github.com/wookieFPV))
- Fixed cancelled picker dialog not resolving with expected result on web. ([#11847](https://github.com/expo/expo/pull/27454) by [@raqso](https://github.com/raqso))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Convert WEBP to PNG instead JPEG when selecting an item in the Media Library with editing enabled. ([#26419](https://github.com/expo/expo/pull/26419) by [@NikitaDudin](https://github.com/NikitaDudin))
- Receiving a correct file extension for WEBP files instead `.jpeg` in the ImagePicker result. ([#26419](https://github.com/expo/expo/pull/26419) by [@NikitaDudin](https://github.com/NikitaDudin))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 14.7.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 14.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 14.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- On Android, support `fileName` and `filesize` in the returned assets. ([#24524](https://github.com/expo/expo/pull/24524) by [@alanjhughes](https://github.com/alanjhughes))
- Support returning the mime type of the returned assets. ([#24659](https://github.com/expo/expo/pull/24659) by [@alanjhughes](https://github.com/alanjhughes))

## 14.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- On Android, the `Uri` type is not serializable and causes a crash when recreating the activity. ([#23768](https://github.com/expo/expo/pull/23768) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Remove deprecation warnings on `ImagePickerResult`. ([#24226](https://github.com/expo/expo/pull/24226) by [@alanjhughes](https://github.com/alanjhughes))

## 14.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 14.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 14.3.2 - 2023-07-23

### 💡 Others

- On Android, restore behavior from [#22658](https://github.com/expo/expo/pull/22658). ([#23617](https://github.com/expo/expo/pull/23617) by [@alanhughes](https://github.com/alanjhughes)) ([#22658](https://github.com/expo/expo/pull/22658), [#23617](https://github.com/expo/expo/pull/23617) by [@alanjhughes](https://github.com/alanjhughes))

## 14.3.1 - 2023-07-04

### 🐛 Bug fixes

- Fix manifest merger build fail on Android. ([#23191](https://github.com/expo/expo/pull/23191) by [@alexandrius](https://github.com/alexandrius))
- [Android] Fix backported photo picker crashing with null intent. ([#23224](https://github.com/expo/expo/pull/23224) by [@thespacemanatee](https://github.com/thespacemanatee))

## 14.3.0 — 2023-06-13

### 🎉 New features

- Added ability to choose the preferred asset representation mode on iOS 14+. ([#22456](https://github.com/expo/expo/pull/22456) by [@thespacemanatee](https://github.com/thespacemanatee))
- Updated the Android image picker to use a [more streamlined and modern interface](https://developer.android.com/training/data-storage/shared/photopicker), closely resembling the one on iOS. [#22658](https://github.com/expo/expo/pull/22658) by [@fobos531](https://github.com/fobos531)

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))
- Fixed an issue that allowed picking non-image/video files when passing `MediaTypeOptions.All` ([#22606](https://github.com/expo/expo/pull/22606) by [@fobos531](https://github.com/fobos531))

## 14.2.0 — 2023-05-08

### 🎉 New features

- Added ability to choose the camera-facing type. ([#22143](https://github.com/expo/expo/pull/22143) by [@YoussefHenna](https://github.com/YoussefHenna))

### 🐛 Bug fixes

- Fix images unexpectedly being converted to `.png` when opening `.bmp` files and selecting any quality in `ImagePickerOptions`. ([#21361](https://github.com/expo/expo/pull/21361) by [@behenate](https://github.com/behenate))
- Fix issue where the array of permissions could end up empty causing an exception. ([#21589](https://github.com/expo/expo/pull/21589) by [@alanhughes](https://github.com/alanjhughes))
- Fix rotated videos returning incorrect width/height. [#12573](https://github.com/expo/expo/issues/12573) ([#21758](https://github.com/expo/expo/pull/21758) by [@mmmulani](https://github.com/mmmulani))
- Fix NullPointerException for launchCameraAsync on Android 13. ([#22123](https://github.com/expo/expo/pull/22123) by [@witheroux](https://github.com/witheroux))
- [Android] Fix image picker returning inverted dimensions when selecting vertical images without editing. ([#22383](https://github.com/expo/expo/pull/22383) by [@behenate](https://github.com/behenate))

## 14.1.1 — 2023-02-09

### ⚠️ Notices

- Removed deprecated fields from pick result type and deprecated `UIImagePickerPresentationStyle` enum values. ([#21078](https://github.com/expo/expo/pull/21078) by [@Simek](https://github.com/Simek))

## 14.1.0 — 2023-01-26

### 🎉 New features

- Add support for [granular permissions](https://developer.android.com/about/versions/13/behavior-changes-13) on Android 13. ([#20908](https://github.com/expo/expo/pull/20908) by [@alanhughes](https://github.com/alanjhughes))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 14.0.3 — 2022-12-30

### 💡 Others

- Avoid dependency on `uuid`. ([#20476](https://github.com/expo/expo/pull/20476) by [@LinusU](https://github.com/LinusU))

## 14.0.2 - 2022-11-21

### 🐛 Bug fixes

- Fix support for animated GIFs on iOS. ([#20034](https://github.com/expo/expo/pull/20034) by [@barthap](https://github.com/barthap))

## 14.0.1 - 2022-11-08

### 🐛 Bug fixes

- Fix incorrect asset type for videos on iOS. ([#19932](https://github.com/expo/expo/pull/19932) by [@tsapeta](https://github.com/tsapeta))

## 14.0.0 — 2022-10-25

### 🛠 Breaking changes

- Remove deprecated `requestCameraRollPermissionsAsync` and `getCameraRollPermissionsAsync` methods, as well as associated to them `CameraRollPermissionResponse` type. ([#18600](https://github.com/expo/expo/pull/18600) by [@Simek](https://github.com/Simek))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))
- Reworked the picking result object for simplicity and better compatibility with the multiple selection. ([#19570](https://github.com/expo/expo/pull/19570) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- The new `PHPickerViewController` is now default picker interface on iOS 14+. ([#18871](https://github.com/expo/expo/pull/18871) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- Fix images taken with `launchCameraAsync` being translated incorrectly on some camera orientations. ([#19185](https://github.com/expo/expo/pull/19185) by [@jacobjaffe](https://github.com/JacobJaffe) and [@reececox](https://github.com/reececox))
- Fix error where `launchImageLibraryAsync()` saved the photo to a global cache directory that was inaccessible in Expo Go. ([#19205](https://github.com/expo/expo/pull/19205) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 13.3.1 — 2022-07-25

_This version does not introduce any user-facing changes._

## 13.3.0 — 2022-07-16

### 🎉 New features

- On iOS 14+ added support for selection limit and on iOS 15+ for ordered selection. ([#18142](https://github.com/expo/expo/pull/18142), [#18143](https://github.com/expo/expo/pull/18143) by [@barthap](https://github.com/barthap))
- The picker now resolves media library asset ID. ([#18236](https://github.com/expo/expo/pull/18236), [#18185](https://github.com/expo/expo/pull/18185) by [@barthap](https://github.com/barthap))
- On iOS, the picker now resolves file name and size and media library asset ID. ([#18179](https://github.com/expo/expo/pull/18179) by [@barthap](https://github.com/barthap))
- On Android added support for selecting multiple images/videos. ([#18161](https://github.com/expo/expo/pull/18161) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- On Android restored support for `allowsEditing` option that was disabled when migrating to `registerForActivityResult` mechanism. ([#17963](https://github.com/expo/expo/pull/17963) by [@bbarthec](https://github.com/bbarthec))

## 13.2.1 — 2022-07-11

_This version does not introduce any user-facing changes._

## 13.2.0 — 2022-07-07

### 🎉 New features

- On iOS 14+ added support for selecting multiple images/videos. ([#18102](https://github.com/expo/expo/pull/18102), [#18138](https://github.com/expo/expo/pull/18138), [#18145](https://github.com/expo/expo/pull/18145) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- Fix crash when picking a GIF image on iOS. ([#18135](https://github.com/expo/expo/pull/18135) by [@barthap](https://github.com/barthap))

### 💡 Others

- On Android migrated to the new `registerForActivityResult` mechanism. This migration disables `allowsEditing` option. ([#17671](https://github.com/expo/expo/pull/17671), ([#17987](https://github.com/expo/expo/pull/17987) by [@bbarthec](https://github.com/bbarthec))
- Native module on Android is now written in Kotlin using [Sweet API](https://docs.expo.dev/modules/module-api). ([#17668](https://github.com/expo/expo/pull/17668) by [@bbarthec](https://github.com/bbarthec))
- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 13.1.1 — 2022-04-27

_This version does not introduce any user-facing changes._

## 13.1.0 — 2022-04-25

### 🎉 New features

- [plugin] Added ability to disable permissions. ([#17168](https://github.com/expo/expo/pull/17168) by [@EvanBacon](https://github.com/EvanBacon))

## 13.0.1 — 2022-04-20

_This version does not introduce any user-facing changes._

## 13.0.0 — 2022-04-18

### 🛠 Breaking changes

- On Android migrated cropping library from `com.theartofdev.edmodo:android-image-cropper@2.8.0` (available from `jcenter()`) to `com.github.CanHub:Android-Image-Cropper@1.1.1` (available from `jitpack.io`). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#15977](https://github.com/expo/expo/pull/15977) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed crashes on Android after image is picked by adding missing dependency `expo-image-loader`. ([#17019](https://github.com/expo/expo/pull/17019) by [@M1ST4KE](https://github.com/M1ST4KE))
- Fix failure on Android when `allowsEditing` is `true` and non-jpeg file picked. ([#16615](https://github.com/expo/expo/pull/16615) by [@mnightingale](https://github.com/mnightingale))

### ⚠ Notices

- Deleted the `UIImagePickerPresentationStyle.BlurOverFullScreen` option as it does not work on iOS. ([#16925](https://github.com/expo/expo/pull/16925) by [@barthap](https://github.com/barthap))
- Deprecated all `PascalCase` values of the `UIImagePickerPresentationStyle` enum. Use their `SNAKE_UPPERCASE` counterparts instead. ([#16925](https://github.com/expo/expo/pull/16925) by [@barthap](https://github.com/barthap))
- Underlying values of the `UIImagePickerPresentationStyle` are now strings. They were integers before. ([#16925](https://github.com/expo/expo/pull/16925) by [@barthap](https://github.com/barthap))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))
- Export missing `PermissionResponse` type. ([#15744](https://github.com/expo/expo/pull/15744) by [@Simek](https://github.com/Simek))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.0.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.0.1 — 2021-12-15

### 🐛 Bug fixes

- Fix unresolved promise when picker was dismissed with a swipe-down on iOS. ([#15511](https://github.com/expo/expo/pull/15511) by [@barthap](https://github.com/barthap))

## 12.0.0 — 2021-12-03

### 🛠 Breaking changes

- Remove typo workaround for `getMediaLibaryPermissionsAsync` method. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))

### 🐛 Bug fixes

- On Web add missing `cancelled` property to the return values of `launchCameraAsync` and `launchImageLibraryAsync` methods. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))

### 💡 Others

- Export missing types: `ImageInfo`, `ImagePickerMultipleResult`, `OpenFileBrowserOptions`, `ExpandImagePickerResult`, `UIImagePickerControllerQualityType` and `UIImagePickerPresentationStyle`. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))
- Extract return object containing `{ cancelled: true }` to separate type `ImagePickerCancelledResult` for `launchCameraAsync` and `launchImageLibraryAsync` methods. ([#14646](https://github.com/expo/expo/pull/14646) by [@Simek](https://github.com/Simek))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add useCameraPermissions and useMediaLibraryPermissions hooks from modules factory. ([#13859](https://github.com/expo/expo/pull/13859) by [@bycedric](https://github.com/bycedric))
- Add possibility to change presentation style on iOS. ([#14068](https://github.com/expo/expo/pull/14068) by [@mstach60161](https://github.com/mstach60161))

### 🐛 Bug fixes

- Add missing `GPSHPositioningError` exif parameter on Android. ([#13998](https://github.com/expo/expo/pull/13998) by [@mstach60161](https://github.com/mstach60161))
- Fix promise not resolving when the app is moved to the background on Android. ([#13975](https://github.com/expo/expo/pull/13975) by [@mstach60161](https://github.com/mstach60161))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Fixed `base64` return on web. ([#12529](https://github.com/expo/expo/pull/12529) by [@simonezuccala](https://github.com/simonezuccala) and [@misterdev](https://github.com/misterdev))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Fixed cases where Picker & Camera would be transparent on iOS 14.5. ([#12897](https://github.com/expo/expo/pull/12897) by [@cruzach](https://github.com/cruzach))
- Add missing exif data to cropped image on Android. ([#14038](https://github.com/expo/expo/pull/14038) by [@mstach60161](https://github.com/mstach60161))

### 💡 Others

- Migrated from `unimodules-file-system-interface` and `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Migrated from `AsyncTask` to Kotlin concurrency utilities. ([#13800](https://github.com/expo/expo/pull/13800) by [@m1st4ke](https://github.com/m1st4ke))

## 10.1.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 10.1.2 — 2021-04-09

### 🐛 Bug fixes

- Added SSR guard. ([#12420](https://github.com/expo/expo/pull/12420) by [@EvanBacon](https://github.com/EvanBacon))
- Reverted focus state listener PR. ([#12420](https://github.com/expo/expo/pull/12420) by [@EvanBacon](https://github.com/EvanBacon))

## 10.1.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 10.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Fixed `launchCameraAsync()` with `allowsEditing` option crashing for some android users. ([#11825](https://github.com/expo/expo/pull/11825) by [@lukmccall](https://github.com/lukmccall))
- Fixed cancelled picker dialog not resolving with expected result on web. ([#11847](https://github.com/expo/expo/pull/11847) by [@jayprado](https://github.com/jayprado))
- Fixed incorrect file URI on Android. ([#11823](https://github.com/expo/expo/pull/11823) by [@lukmccall](https://github.com/lukmccall))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed possible unsafe call in VideoResultTask. ([#11552](https://github.com/expo/expo/pull/11552) by [@Duell10111](https://github.com/Duell10111))

## 9.2.1 — 2020-12-09

### 🐛 Bug fixes

- Fix typo in media library permission methods. ([#11292](https://github.com/expo/expo/pull/11292) by [@bycedric](https://github.com/bycedric))

## 9.2.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.1.1 — 2020-09-23

### 🐛 Bug fixes

- `launchImageLibraryAsync()` should be callable with no options argument ([#10306](https://github.com/expo/expo/pull/10306))

## 9.1.0 — 2020-08-18

### 🎉 New features

- Added a way to handle results when activity was killed by the android. ([#9697](https://github.com/expo/expo/pull/9697) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Return array of `ImagePickerResult` when `allowsMultipleSelection` is set to `true` on Web. ([#9402](https://github.com/expo/expo/pull/9402) by [@isthaison](https://github.com/isthaison))
- video recorded on iOS recorded was producing [low resolution](https://github.com/expo/expo/issues/6224) videos, not it's fixed, and can be configured via the `videoQuality` option. ([#9808](https://github.com/expo/expo/pull/9808) by [@vujevits](https://github.com/vujevits))

## 9.0.0 — 2020-08-11

### 🛠 Breaking changes

- Added camera and external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9230](https://github.com/expo/expo/pull/9230) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))
- Added `videoMaxDuration` option to `launchCameraAsync()` to configure video recording duration limit. ([#9486](https://github.com/expo/expo/pull/9486) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed downsizing cropped image, when `allowsEditing` was `true`. ([#9316](https://github.com/expo/expo/pull/9316) by [@barthap](https://github.com/barthap))

## 8.3.0 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))

### 🐛 Bug fixes

- Skip asking for camera permissions on web with `ImagePicker.getCameraPermissionsAsync`. ([#8475](https://github.com/expo/expo/pull/8475) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed exception when calling `ImagePicker.getCameraPermissionsAsync` on Web. ([#7498](https://github.com/expo/expo/pull/7498) by [@IjzerenHein](https://github.com/IjzerenHein))
