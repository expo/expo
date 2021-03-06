# Changelog

This is the log of notable changes to the Expo client that are developer-facing.
Package-specific changes not released in any SDK will be added here just before the release. Until then, you can find them in changelogs of the individual packages (see [packages](./packages) directory).

## Unpublished

### 📚 3rd party library updates

- Updated `@react-native-picker/picker` from `1.9.2` to `1.9.11`. ([#11956](https://github.com/expo/expo/pull/11956) by [@tsapeta](https://github.com/tsapeta))
- Updated `lottie-react-native` from `2.6.1` to `3.5.0`. ([#11586](https://github.com/expo/expo/pull/11586) and [#11950](https://github.com/expo/expo/pull/11950) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/netinfo` from `5.9.7` to `6.0.0`. ([#11947](https://github.com/expo/expo/pull/11947) by [@tsapeta](https://github.com/tsapeta)) and ([#12112](https://github.com/expo/expo/pull/12112) by [@brentvatne](https://github.com/brentvatne))
- Updated `react-native-webview` from `10.10.2` to `11.2.3`. ([#11964](https://github.com/expo/expo/pull/11964) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-segmented-control/segmented-control` from `2.2.1` to `2.3.0`. Side note: the package has changed its NPM scope from `@react-native-community/segmented-control`. ([#11996](https://github.com/expo/expo/pull/11996) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/viewpager` from `4.2.0` to `4.2.3`. ([#12003](https://github.com/expo/expo/pull/12003) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-gesture-handler` from `1.8.0` to `1.10.2`. ([#12031](https://github.com/expo/expo/pull/12031) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-screens` from `2.15.2` to `2.18.1`. ([#12047](https://github.com/expo/expo/pull/12047) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Remove deprecated `Linking` module from `expo`. ([#12128](https://github.com/expo/expo/pull/12128) by [@EvanBacon](https://github.com/EvanBacon))
- Removed module migration errors from `expo`. ([#11902](https://github.com/expo/expo/pull/11902) by [@EvanBacon](https://github.com/EvanBacon))
- Removed `DangerZone` from `expo`. ([#11902](https://github.com/expo/expo/pull/11902) by [@EvanBacon](https://github.com/EvanBacon))
- Removed `expo-secure-store` dependency from `expo`. ([#11902](https://github.com/expo/expo/pull/11902) by [@EvanBacon](https://github.com/EvanBacon))
- Dropped support for importing undocumented method `apisAreAvailable` from `expo`. ([#11903](https://github.com/expo/expo/pull/11903) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `expo-linear-gradient`, `expo-linking`, `expo-location`, `expo-permissions`, and `expo-sqlite` dependencies from `expo`, along with related globals. As a side effect, `navigator.geolocation` is no longer automatically polyfilled unless the developer installs `expo-location` in the project. ([#12097](https://github.com/expo/expo/pull/12097) by [@brentvatne](https://github.com/brentvatne))
- Remove warning when `Constants.manifest.experiments.redesignedLogBox` is used in app config, it has been around since SDK 39.  ([#12097](https://github.com/expo/expo/pull/12097) by [@brentvatne](https://github.com/brentvatne))

### 🎉 New features

### 🐛 Bug fixes

- Fix Expo CLI logging, which was not always limiting the length of strings to 10k characters. ([#11776](https://github.com/expo/expo/pull/11776) by [@fson](https://github.com/fson))
- Fix bare templates on Android to pass `null` to `com/facebook/react/ReactActivity.onCreate` to [avoid potential inconsistencies when restoring from background](https://github.com/expo/expo/issues/12002).

## 40.0.0 — 2020-11-17

### 📚 3rd party library updates

- Updated `@react-native-community/picker@1.6.6` to `@react-native-picker/picker@1.9.2`. ([#11029](https://github.com/expo/expo/pull/11029) by [@brentvatne](https://github.com/brentvatne))
- Updated `@react-native-community/segmented-control` from `2.1.1` to `2.2.1`. ([#11029](https://github.com/expo/expo/pull/11029) by [@brentvatne](https://github.com/brentvatne))
- Updated `react-native-gesture-handler` from `1.7.0` to `1.8.0`. ([#11029](https://github.com/expo/expo/pull/11029) by [@brentvatne](https://github.com/brentvatne))
- Updated `@react-native-community/netinfo` from `5.9.6` to `5.9.7`. ([#11029](https://github.com/expo/expo/pull/11029) by [@brentvatne](https://github.com/brentvatne))
- Updated `react-native-safe-area-context` from `3.1.4` to `3.1.9`. ([#11029](https://github.com/expo/expo/pull/11029) by [@brentvatne](https://github.com/brentvatne))
- Updated `@react-native-community/viewpager` from `4.1.6` to `4.2.0`. ([#11009](https://github.com/expo/expo/pull/11009) by [@cruzach](https://github.com/cruzach))
- Updated `@react-native-community/datetimepicker` from `3.0.0` to `3.0.4`. ([#10980](https://github.com/expo/expo/pull/10980) by [@cruzach](https://github.com/cruzach))
- Updated `react-native-screens` from `2.10.1` to `2.15.0`. ([#10980](https://github.com/expo/expo/pull/10980) by [@bbarthec](https://github.com/bbarthec))
- Upgraded `react-native-reanimated` v2 support from `2.0.0-alpha.6` to `2.0.0-rc.0`. ([#11048](https://github.com/expo/expo/pull/11048), [#11095](https://github.com/expo/expo/pull/11095), [#11145](https://github.com/expo/expo/pull/11145) by [@sjchmiela](https://github.com/sjchmiela))

### 🛠 Breaking changes

- Removed `@react-native-community/picker`, replaced with `@react-native-picker/picker`. ([#11029](https://github.com/expo/expo/pull/11029) by [@brentvatne](https://github.com/brentvatne))
- Removed “info”, “save” and “pin” functionalities from persistent notification shown in notification tray while developing an experience via Expo client on Android. ([#10333](https://github.com/expo/expo/pull/10333), [#10334](https://github.com/expo/expo/pull/10334) by [@sjchmiela](https://github.com/sjchmiela))
- Removed support for `androidShowExponentNotificationInShellApp` property in app manifest (it was responsible for enabling persistent development notification in standalone apps). ([#10335](https://github.com/expo/expo/pull/10335) by [@sjchmiela](https://github.com/sjchmiela))
- `AppLoading` is extracted to the separate `expo-app-loading` module. ([#10929](https://github.com/expo/expo/pull/10929) by [@bbartec](https://github.com/bbartec))
- **`@unimodules/core`**
  - Removed `org.unimodules.core.InvalidArgumentException`. Please use its coded version, `org.unimodules.core.errors.InvalidArgumentException`, instead. ([#9961](https://github.com/expo/expo/pull/9961) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-analytics-amplitude`**
  - Upgraded native Amplitude iOS library from `4.7.1` to `6.0.0`. This removes the IDFA code that was previously included with the Amplitude library. `disableIDFA` option for `Amplitude.setTrackingOptions` is removed. If you would like to collect the IDFA, you must be in the bare workflow. ([#9880](https://github.com/expo/expo/pull/9880) by [@bbarthec](https://github.com/bbarthec))
  - Renamed all methods to include the 'Async' suffix:
  - All methods now return a Promise. ([#9212](https://github.com/expo/expo/pull/9212/) by [@cruzach](https://github.com/cruzach))
- **`expo-auth-session`**
  - `expo-random` is now a peer dependency rather than a dependency. ([#11280](https://github.com/expo/expo/pull/11280) by [@brentvatne](https://github.com/brentvatne))
- **`expo-blur`**
  - Explicitly pass down only the expected props on iOS. ([#10648](https://github.com/expo/expo/pull/10648) by [@cruzach](https://github.com/cruzach))
- **`expo-branch`**
  - On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))
- **`expo-mail-composer`**
  - Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))
- **`expo-media-library`**
  - On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))
  - Renamed `MediaLibrary.MediaLibraryAssetChangeEvent` type to `MediaLibrary.MediaLibraryAssetsChangeEvent`.
- **`expo-location`**
  - Make background location an opt-in permission on Android. ([#10989](https://github.com/expo/expo/pull/10989) by [@bycedric](https://github.com/bycedric))
- **`expo-notifications`**
  - Changed the way `PermissionResponse.status` is calculated on iOS. Previously, it returns the numeric value of `UMPermissionStatus` which does not match the TypeScript enum declaration. ([#10513](https://github.com/expo/expo/pull/10513) by [@cHaLkdusT](https://github.com/cHaLkdusT))
  - Changed the way `NotificationContent.data` is calculated on iOS. Previously it was the contents of remote notification payload with all entries from under `"body"` moved from under `"body"` to root level. Now it's the sole unchanged contents of `payload["body"]`. Other fields of the payload can now be accessed on iOS through `PushNotificationTrigger.payload` (similarly to how other fields of native remote message can be accessed on Android under `PushNotificationTrigger.remoteMessage`). ([#10453](https://github.com/expo/expo/pull/10453) by [@sjchmiela](https://github.com/sjchmiela))
  - Changed class responsible for handling Firebase events from `FirebaseMessagingService` to `.service.NotificationsService` on Android. ([#10558](https://github.com/expo/expo/pull/10558) by [@sjchmiela](https://github.com/sjchmiela))
  - Changed how you can override ways in which a notification is reinterpreted from a [`StatusBarNotification`](https://developer.android.com/reference/android/service/notification/StatusBarNotification) and in which a [`Notification`](https://developer.android.com/reference/android/app/Notification.html?hl=en) is built from defining an `expo.modules.notifications#NotificationsScoper` meta-data value in `AndroidManifest.xml` to implementing a `BroadcastReceiver` subclassing `NotificationsService` delegating those responsibilities to your custom `PresentationDelegate` instance. ([#10558](https://github.com/expo/expo/pull/10558) by [@sjchmiela](https://github.com/sjchmiela))
  - Removed `removeAllNotificationListeners` method. You can (and should) still remove listeners using `remove` method on `Subscription` objects returned by `addNotification…Listener`. ([#10883](https://github.com/expo/expo/pull/10883) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-random`**
  - On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))
- **`expo-screen-capture`**
  - Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))
- **`expo-permissions`**
  - Make background location an opt-in permission on Android. ([#10989](https://github.com/expo/expo/pull/10989) by [@bycedric](https://github.com/bycedric))
  - Upgrade `androidx.appcompat` to `1.2.0`. ([#11018](https://github.com/expo/expo/pull/11018) by [@bbarthec](https://github.com/bbarthec))
- **`@expo/vector-icons`**
  - Updated icon sets to match react-native-vector-icons@7.1.0. ([b146b86b](https://github.com/expo/expo/commit/b146b86bf3b1580b2f2523eb6cd0bd2325b04949)) by [@brentvatne](https://github.com/brentvatne)

### 🎉 New features

- **`expo-auth-session`**
  - Create built-in `providers/google` for easy Google auth. ([#9361](https://github.com/expo/expo/pull/9361) by [@EvanBacon](https://github.com/EvanBacon))
  - Create built-in `providers/facebook` for easy Facebook auth. ([#9361](https://github.com/expo/expo/pull/9361) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-camera`**
  - Added support for video poster to show while the camera is loading on web. ([#9930](https://github.com/expo/expo/pull/9930) by [@liorJuice](https://github.com/liorJuice))
  - Added `videoBitrate` option for camera on Android. ([#4878](https://github.com/expo/expo/pull/4878) by [@xHeinrich](https://github.com/xHeinrich))
- **`expo-clipboard`**
  - Publish initial release to provide a migration path off of React Native Clipboard API. ([#11227](https://github.com/expo/expo/pull/11227)) by [@cruzach](https://github.com/cruzach).?
- **`expo-constants`**
  - Added `Constants.executionEnvironment` to distinguish between apps running in a bare, managed standalone, or App/Play Store development client environment. ([#10986](https://github.com/expo/expo/pull/10986) by [@esamelson](https://github.com/esamelson))
  - Added script to embed app configuration into a bare app and export this object as `Constants.manifest`. ([#10948](https://github.com/expo/expo/pull/10948) and [#10949](https://github.com/expo/expo/pull/10949) by [@esamelson](https://github.com/esamelson))
  - If `manifest` is defined on `expo-updates` then use it instead of `ExponentConstants.manifest` ([#10668](https://github.com/expo/expo/pull/10668) by [@esamelson](https://github.com/esamelson))
  - Warn when developer attempts to access empty `Constants.manifest` in bare. Throw error when it is empty in managed. ([#11028](https://github.com/expo/expo/pull/11028) by [@esamelson](https://github.com/esamelson))
- **`expo-branch`**
  - Updated `react-native-branch` vendored code to 5.0.0, upgraded underlying Branch SDKs, see [`react-native-branch`'s changelog](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution/blob/master/ChangeLog.md) for full list of changes. ([#10204](https://github.com/expo/expo/pull/10204) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-gl`**
  - Enable stencil buffer on Android ([#9928](https://github.com/expo/expo/pull/9928) by [@wkozyra95](https://github.com/wkozyra95))
- **`expo-media-library`**
  - Added the `MediaLibrary.presentPermissionsPickerAsync` method that displays the system prompt allowing the user to change the selected permitted assets` on iOS.
- **`expo-notifications`**
  - Added `useLastNotificationResponse` React hook that always returns the notification response that has been emitted most recently. ([#10883](https://github.com/expo/expo/pull/10883) by [@sjchmiela](https://github.com/sjchmiela))
  - Added `WeeklyTriggerInput` that allows scheduling a weekly recurring notification for a specific day of week, hour and minute. It is supported on both iOS and Android. ([#9973](https://github.com/expo/expo/pull/9973) by [@RikTheunis](https://github.com/riktheunis))
  - Added `getNextTriggerDateAsync` method allowing you to verify manually when would the next trigger date for a particular notification trigger be. ([#10455](https://github.com/expo/expo/pull/10455) by [@sjchmiela](https://github.com/sjchmiela))
  - Added support for restoring scheduled notifications alarms on Android after an app is updated. ([#10708](https://github.com/expo/expo/pull/10708) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-store-review`**
  - Implemented native [In-App Review](https://developer.android.com/guide/playcore/in-app-review) for Android. ([#9607](https://github.com/expo/expo/pull/9607) by [@spezzino](https://github.com/spezzino))
- **`expo-task-manager`**
  - Added `isAvailableAsync` method. ([#10657](https://github.com/expo/expo/pull/10657) by [@PranshuChittora](https://github.com/pranshuchittora))

### 🐛 Bug fixes

- Fix `NotificationsHandler` & `ExpoNotificationCategoriesModule` reading from the wrong SharedPreferences files, resulting in categories not being applied in Android standalone apps. ([#10624](https://github.com/expo/expo/pull/10624) by [@cruzach](https://github.com/cruzach))
- Set mIntentUri from intent in DetachActivity.onCreate to fix Linking.getInitialURL in Android standalone apps ([#10535](https://github.com/expo/expo/pull/10535) by [@esamelson](https://github.com/esamelson))
- Only update the splash screen when it receives update configuration values on iOS ([#10512](https://github.com/expo/expo/pull/10512) by [@brentvatne](https://github.com/brentvatne))
- Only update the splash screen when it receives update configuration values on Android ([#10522](https://github.com/expo/expo/pull/10522) by [@esamelson](https://github.com/esamelson))
- Show helpful error message when expo-cli responds with an incompatible project on iOS ([#10508](https://github.com/expo/expo/pull/10508) by [@esamelson](https://github.com/esamelson))
- Show helpful error message when expo-cli responds with an incompatible project on Android ([#10511](https://github.com/expo/expo/pull/10511) by [@esamelson](https://github.com/esamelson))
- Pass experience properties correctly to turbo modules ([#10504](https://github.com/expo/expo/pull/10504) by [@esamelson](https://github.com/esamelson))
- Fix splash screen in standalone app builds for Android ([#10519](https://github.com/expo/expo/pull/10519) by [@bbartec](https://github.com/bbartec))
- Fix splash screen `hideAsync` warnings in client ([#10294](https://github.com/expo/expo/pull/10294) by [@bbartec](https://github.com/bbartec))
- Fix EXDisabledRedBox not overriding RCTRedBox, this caused a redbox to appear above the Expo client specific UI when failing to load a published app ([#10498](https://github.com/expo/expo/pull/10498) by [@sjchmiela](https://github.com/sjchmiela))
- Fix reading splash image from the android.splash config ([#10494](https://github.com/expo/expo/pull/10494) by [@bbartec](https://github.com/bbartec))
- Remove the large notification icon from managed apps, because there is no mechanism to set it yet ([#10492](https://github.com/expo/expo/pull/10492) by [@lukmccall](https://github.com/lukmccall))
- Fix the app icon is always added as a notification icon ([#10471](https://github.com/expo/expo/pull/10471) by [@lukmccall](https://github.com/lukmccall))
- **`expo-updates`**
  - `Updates.reloadAsync` not supported in development ([#10310](https://github.com/expo/expo/pull/10310) by [@esamelson](https://github.com/esamelson))
  - Support absolute `assetUrlOverride` ([#10337](https://github.com/expo/expo/pull/10337) by [@esamelson](https://github.com/esamelson))
  - Handle `./` in `assetUrlOverride` ([#10342](https://github.com/expo/expo/pull/10342) by [@esamelson](https://github.com/esamelson))
- **`@unimodules/core`**
  - Fixed the `DoNotStrip` annotation not working with classes. ([#10421](https://github.com/expo/expo/pull/10421) by [@lukmccall](https://github.com/lukmccall))
- **`@unimodules/react-native-adapter`**
  - Fixed invalid numbers of listeners being considered unregistered on iOS, resulting in _Attempted to remove more '{ModuleName}' listeners than added._ errors. ([#10771](https://github.com/expo/expo/pull/10771) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-ads-facebook`**
  - Upgraded the underlying Android SDK to 5.11.0 (was 5.1.1, which has been deprecated and would result in an error). No user-facing changes involved. ([#10430](https://github.com/expo/expo/pull/10430) by [@cruzach](https://github.com/cruzach))
  - Upgraded the underlying iOS SDK to 5.9.0. No user-facing changes involved. ([#10430](https://github.com/expo/expo/pull/10430) by [@cruzach](https://github.com/cruzach))
  - Removed extra padding above banner ads on iOS. ([#10433](https://github.com/expo/expo/pull/10433) by [@cruzach](https://github.com/cruzach))
- **`expo-auth-session`**
  - Improved mechanism used to determine whether in bare or managed workflow. ([#10993](https://github.com/expo/expo/pull/10993) by [@esamelson](https://github.com/esamelson))
- **`expo-barcode-scanner`**
  - Allow `onBarCodeScanned` prop to be `undefined`. ([#10068](https://github.com/expo/expo/pull/10068) by [@josmithua](https://github.com/josmithua))
- **`expo-brightness`**
  - Removed use of `org.unimodules.core.InvalidArgumentException` in favor of its coded version, `org.unimodules.core.errors.InvalidArgumentException`. ([#9961](https://github.com/expo/expo/pull/9961) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-av`**
  - Fix orientation being returned incorrectly for videos in portrait mode in onReadyForDisplay on iOS. ([#10449](https://github.com/expo/expo/pull/10449) by [@lachenmayer](https://github.com/lachenmayer))
  - Fix looping stops after 3 times on iOS. ([#10602](https://github.com/expo/expo/pull/10602) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix Audio.stopAndUnloadAsync not handling no-data on Android. ([#9877](https://github.com/expo/expo/pull/9877) by [@IjzerenHein](https://github.com/IjzerenHein))
- **`expo-contacts`**
  - `getContactsAsync` no longer requires an exact match when providing the `name` query on Android. ([#10127](https://github.com/expo/expo/pull/10127) by [@cruzach](https://github.com/cruzach))
- **`expo-document-picker`**
  - Fixed `UIDocumentPickerViewController` being `nil` on iOS 14 and thus causing the hard-crash of the application. ([#10327](https://github.com/expo/expo/pull/10327) by [@bbarthec](https://github.com/bbarthec))
  - Fixed `Promise` not being fulfilled if the document picker view controller was being dismissed by gesture on iOS. ([#10325](https://github.com/expo/expo/pull/10325) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-firebase-analytics`**
  - Fix exception in setCurrentScreen on Android. ([#10804](https://github.com/expo/expo/pull/10804) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix setup native firebase link in README. ([#10740](https://github.com/expo/expo/pull/10740) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-gl`**
  - Fixed a bug causing an application crash when enabling remote debugging on Android. ([#10381](https://github.com/expo/expo/pull/10381) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed support for offset in TypedArray. ([#10692](https://github.com/expo/expo/pull/10692) by [@wkozyra95](https://github.com/wkozyra95))
- **`expo-image-picker`**
  - `launchImageLibraryAsync()` should be callable with no options argument ([#10306](https://github.com/expo/expo/pull/10306))
- **`expo-local-authentication`**
  - Fixed `cancelAuthenticate` not working in Android as expected. ([#10482](https://github.com/expo/expo/pull/10482) by [@huisf](https://github.com/HuiSF))
  - Guard against crash on Android when `FragmentActivity` is null creating the Biometric Prompt. ([#10679](https://github.com/expo/expo/pull/10679) by [@vascofg](https://github.com/vascofg))
  - Guard against Null Pointer Exception on Android when calling `authenticate` on the Biometric Prompt after resuming the app on some devices. ([#10965](https://github.com/expo/expo/pull/10965) by [@vascofg](https://github.com/vascofg))
- **`expo-linking`**
  - Prevent crash in bare workflow if `Constants.manifest` isn't defined.
  - Improved mechanism used to determine whether in bare or managed workflow. ([#10993](https://github.com/expo/expo/pull/10993) by [@esamelson](https://github.com/esamelson))
- **`expo-linear-gradient`**
  - Added `children` property to `LinearGradient` component ([#10227](https://github.com/expo/expo/pull/10227) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-media-library`**
  - Fixed `RuntimeException: setDataSource failed: status = 0x80000000` caused by `MediaMetadataRetriever`. ([#9855](https://github.com/expo/expo/pull/9855) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `media-library` methods failing when not all permissions were granted on iOS 14. ([#10026](https://github.com/expo/expo/pull/10026) by [@lukmccall](https://github.com/lukmccall))
- **`expo-location`**
  - Redeliver intent when restarting task service. ([#10410](https://github.com/expo/expo/pull/10410) by [@byCedric](https://github.com/byCedric))
- **`expo-notifications`**
  - Fixed TypeScript definition: `setNotificationCategoryAsync` should expect `options.allowAnnouncement`, **not** `options.allowAnnouncment`. ([#11025](https://github.com/expo/expo/pull/11025) by [@cruzach](https://github.com/cruzach))
  - Fixed issue where custom notification icon and color weren't being properly applied in Android managed workflow apps. ([#10828](https://github.com/expo/expo/pull/10828) by [@cruzach](https://github.com/cruzach))
  - Fixed case where Android managed workflow apps could crash when receiving an interactive notification. ([#10608](https://github.com/expo/expo/pull/10608) by [@cruzach](https://github.com/cruzach))
  - Fixed case where Android apps could crash if you set a new category with a text input action **without** providing any `options`. ([#10141](https://github.com/expo/expo/pull/10141) by [@cruzach](https://github.com/cruzach))
  - Android apps no longer rely on the `submitButtonTitle` property as the action button title (they rely on `buttonTitle`, which matches iOS behavior). ([#10141](https://github.com/expo/expo/pull/10141) by [@cruzach](https://github.com/cruzach))
  - Fixed `Notifications.requestPermissions()` returning `undetermined` instead of a known status in some browsers. ([#10296](https://github.com/expo/expo/pull/10296) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed crashing when Proguard is enabled. ([#10421](https://github.com/expo/expo/pull/10421) by [@lukmccall](https://github.com/lukmccall))
  - Fixed the application icon being always added as a notification icon. ([#10471](https://github.com/expo/expo/pull/10471) by [@lukmccall](https://github.com/lukmccall))
  - Fixed faulty trigger detection mechanism which caused some triggers with `channelId` specified get recognized as triggers of other types. ([#10454](https://github.com/expo/expo/pull/10454) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed fatal exception sometimes being thrown when notification was received or tapped on Android due to observer being cleared before it's added. ([#10640](https://github.com/expo/expo/pull/10640) by [@sjchmiela](https://github.com/sjchmiela))
  - Removed the large icon from managed workflow. ([#10492](https://github.com/expo/expo/pull/10492) by [@lukmccall](https://github.com/lukmccall))
  - Fixed crash happening due to non-existent `ExpoNotificationsService` being declared in `AndroidManifest.xml`. ([#10638](https://github.com/expo/expo/pull/10638) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed notifications _not_ playing any sound when `shouldShowAlert: false` but `shouldPlaySound: true` in `setNotificationHandler`. ([#10699](https://github.com/expo/expo/pull/10699) by [@cruzach](https://github.com/cruzach))
  - Add guard against badgin usage in SSR environments. ([#10741](https://github.com/expo/expo/pull/10741) by [@bycedric](https://github.com/bycedric))
  - Moved notification events handling from main thread to a background thread which makes users' devices more responsive. ([#10762](https://github.com/expo/expo/pull/10762) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed having to define `CATEGORY_DEFAULT` on an `Activity` that is expected to receive `expo.modules.notifications.OPEN_APP_ACTION` intent when handling notification response. ([#10755](https://github.com/expo/expo/pull/10755) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed notifications not being returned at all from `getAllPresentedNotificationsAsync()` if the library fails to reconstruct notification request based on marshaled copy in notification data. From now on they'll be naively reconstructed from the Android notification. ([#10801](https://github.com/expo/expo/pull/10801) by [@sjchmiela](https://github.com/sjchmiela))
  - May have helped fix an issue where "initial notification response" (the one that opened the app) was not being delivered to Android apps. ([#10773](https://github.com/expo/expo/pull/10773) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-random`**
  - Clarify that react-native-unimodules is a dependency in README
  - Add a placeholder .xcodeproj file so that React Native CLI autolinking will detect the EXRandom podspec
- **`expo-sharing`**
  - Removed use of `org.unimodules.core.InvalidArgumentException` in favor of its coded version, `org.unimodules.core.errors.InvalidArgumentException`. ([#9961](https://github.com/expo/expo/pull/9961) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-store-review`**
  - [expo-store-review] Fix Android crash in failure path ([#10265](https://github.com/expo/expo/pull/10265) by [@danmaas](https://github.com/danmaas))
- **`unimodules-font-interface`**
  - Fix import error when importing from JavaScript. ([#10753](https://github.com/expo/expo/pull/10753) by [@IjzerenHein](https://github.com/IjzerenHein))
- **`unimodules-task-manager-interface`**
  - Fix import error when importing from JavaScript. ([#10753](https://github.com/expo/expo/pull/10753) by [@IjzerenHein](https://github.com/IjzerenHein))

## 39.0.0 — 2020-08-18

### 📚 3rd party library updates

- Updated `@react-native-community/datetimepicker` from `2.4.0` to `3.0.0`. ([#9543](https://github.com/expo/expo/pull/9543), [#9706](https://github.com/expo/expo/pull/9706) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `@react-native-community/netinfo` from `5.9.2` to `5.9.6`. ([#9564](https://github.com/expo/expo/pull/9564), [#9737](https://github.com/expo/expo/pull/9737) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `@react-native-community/picker` from `1.6.0` to `1.6.6`. ([#9533](https://github.com/expo/expo/pull/9533), [#9737](https://github.com/expo/expo/pull/9737) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `@react-native-community/segmented-control` from `1.6.1` to `2.1.1`. ([`ae45e23`](https://github.com/expo/expo/commit/ae45e23931745e6973e9d5221bf6837757031ef5), [#9534](https://github.com/expo/expo/pull/9534), [#9737](https://github.com/expo/expo/pull/9737) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `@react-native-community/slider` from `3.0.0` to `3.0.3`. ([#9532](https://github.com/expo/expo/pull/9532) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `@react-native-community/viewpager` from `3.3.0` to `4.1.6`. ([#9535](https://github.com/expo/expo/pull/9535), [#9737](https://github.com/expo/expo/pull/9737) by [@sjchmiela](https://github.com/sjchmiela), [#9807](https://github.com/expo/expo/pull/9807) by [@bbarthec](https://github.com/bbarthec))
- Updated `react-native-reanimated` from `1.9.0` to `1.13.0`. ([#9608](https://github.com/expo/expo/pull/9608), [#9738](https://github.com/expo/expo/pull/9738) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `react-native-safe-area-context` from `3.0.2` to `3.1.4`. ([#9548](https://github.com/expo/expo/pull/9548), [#9737](https://github.com/expo/expo/pull/9737) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `react-native-screens` from `2.9.0` to `2.10.1`. ([#9611](https://github.com/expo/expo/pull/9611) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `react-native-webview` from `9.4.0` to `10.7.0`. ([#9549](https://github.com/expo/expo/pull/9549), [#9737](https://github.com/expo/expo/pull/9737) by [@sjchmiela](https://github.com/sjchmiela), [#9803](https://github.com/expo/expo/pull/9803) by [@bbarthec](https://github.com/bbarthec))

### 🛠 Breaking changes

- Removed GCM entirely from the Android client and standalone apps since the server APIs have been shut down. ([#6071](https://github.com/expo/expo/pull/6071), [#9735](https://github.com/expo/expo/pull/9735) by [@esamelson](https://github.com/esamelson))
- **`expo`**
  - The `SplashScreen` and `Updates` module exports have been removed in favor of the `expo-splash-screen` and `expo-updates` packages. You'll need to install and import from the individual packages if you use either module.
- **`@unimodules/react-native-adapter`**
  - Deprecate `RCTDeviceEventEmitter` in favor of the renamed `DeviceEventEmitter`. ([#8826](https://github.com/expo/expo/pull/8826) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-analytics-amplitude`**
  - Upgraded native Amplitude iOS library from `4.7.1` to `6.0.0`. This removes the IDFA code that was previously included with the Amplitude library. `disableIDFA` option for `Amplitude.setTrackingOptions` is removed. If you would like to collect the IDFA, you must be in the bare workflow. ([#9880](https://github.com/expo/expo/pull/9880) by [@bbarthec](https://github.com/bbarthec))
- **`expo-analytics-segment`**
  - Upgraded Segment Analytics iOS to 4.0.4. **This removes the IDFA code that was previously included with the Segment library.** If you would like to collect the IDFA, you must be in the bare workflow or use SDK < 39. ([#9606](https://github.com/expo/expo/pull/9606) by [@cruzach](https://github.com/cruzach/)).
  - The `options` argument for `Segment.alias` now accepts context configuration as well as integration configuration. Previously, this expected just the `integrations` configuration. ([#9606](https://github.com/expo/expo/pull/9606) by [@cruzach](https://github.com/cruzach/)). The expected format now is:
- **`expo-barcode-scanner`**
  - Added camera permissions declarations to `AndroidManifest.xml` on Android. ([#9227](https://github.com/expo/expo/pull/9227) by [@bycedric](https://github.com/bycedric))
- **`expo-battery`**
  - Added support for FULL state on web. ([#8937](https://github.com/expo/expo/pull/8937) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-camera`**
  - Fix bug where `barCodeTypes` needed to be defined on web. ([#9630](https://github.com/expo/expo/pull/9630) by [@EvanBacon](https://github.com/EvanBacon))
  - Fix bug where camera would sometimes not start on web desktop. ([#9630](https://github.com/expo/expo/pull/9630) by [@EvanBacon](https://github.com/EvanBacon))
  - Deleted `CaptureOptions` in favor of `CameraPictureOptions` ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
  - Added camera permissions declarations to `AndroidManifest.xml` on Android. ([#9224](https://github.com/expo/expo/pull/9224) by [@bycedric](https://github.com/bycedric))
- **`expo-facebook`**
  - All methods and platforms now return times in JS `Date` objects instead of seconds. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
  - Error code `E_CONF_ERROR` has been replaced with `ERR_FACEBOOK_MISCONFIGURED`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
  - Some instances of the error code `E_NO_INIT` in the client have been replaced with `ERR_FACEBOOK_UNINITIALIZED`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
  - Some instances of the error code `E_FBLOGIN_ERROR` in the client have been replaced with `ERR_FACEBOOK_LOGIN`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
  - `initializeAsync` now accepts a single argument of type [`FacebookInitializationOptions`](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/facebook.md#login-options), previously this method accepted two arguments: `appId: string` & `appName: string`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- **`expo-gl`**
  - This version requires at least version 0.63.0 of React Native. It may crash when used with older versions. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))
- **`expo-image-picker`**
  - Added camera and external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9230](https://github.com/expo/expo/pull/9230) by [@bycedric](https://github.com/bycedric))
- **`expo-localization`**
  - `Localization.region` changed from `undefined | string` to `null | string` on web to match iOS. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-location`**
  - Add `scope` field in returned value to indicate whether background permissions are granted. Add `android.accuracy` field to determine whether `coarse` or `fine` location permission is granted. ([#9446](https://github.com/expo/expo/pull/9446) by [@mczernek](https://github.com/mczernek))
  - `getLastKnownPositionAsync` no longer rejects when the last known location is not available – now it returns `null`. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Removed the deprecated `enableHighAccuracy` option of `getCurrentPositionAsync`. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Removed `maximumAge` and `timeout` options from `getCurrentPositionAsync` – it's been Android only and the same behavior can be achieved on all platforms on the JavaScript side. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Made type and enum names more consistent and in line with our standards — they all are now prefixed by `Location`. The most common ones are still accessible without the prefix, but it's not the recommended way. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - `geocodeAsync` and `reverseGeocodeAsync` no longer falls back to Google Maps API on Android. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))
- **`expo-media-library`**
  - Added external storage permissions declarations to `AndroidManifest.xml` on Android. ([#9231](https://github.com/expo/expo/pull/9231) by [@bycedric](https://github.com/bycedric))
- **`expo-screen-orientation`**
  - Now the module will keep the lock active when the app backgrounds. ([#8727](https://github.com/expo/expo/pull/8727) by [@lukmccall](https://github.com/lukmccall))
- **`expo-permissions`**
  - Fixed motion permission bug on web. ([#9670](https://github.com/expo/expo/pull/9670) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added support for `experiments.turboModules` flag in `app.json`/`app.config.js` allowing developers to enable Turbo Modules on iOS. ([#9908](https://github.com/expo/expo/pull/9908) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-ads-facebook`**
  - Add `onError` property to components created with `withNativeAd` that lets you get notified of errors that might occur when the native SDK tries to fetch ads. ([#8662](https://github.com/expo/expo/pull/8662) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-ads-admob`**
  - Added `isAvailableAsync`. ([#9690](https://github.com/expo/expo/pull/9690) by [@EvanBacon](https://github.com/EvanBacon))
  - Delete `prop-types` in favor of TypeScript. ([#8677](https://github.com/expo/expo/pull/8677) by [@EvanBacon](https://github.com/EvanBacon))
- **`@unimodules/react-native-adapter`**
  - Remove `prop-types` ([#8681](https://github.com/expo/expo/pull/8681) by [@EvanBacon](https://github.com/EvanBacon))
  - Add `Platform.isDOMAvailable` to detect web browser environments. ([#8645](https://github.com/expo/expo/pull/8645) by [@EvanBacon](https://github.com/EvanBacon))
  - Add `Platform.select()` method to switch values between platforms. ([#8645](https://github.com/expo/expo/pull/8645) by [@EvanBacon](https://github.com/EvanBacon))
  - Upgrade to `react-native-web@~0.12`. ([#9023](https://github.com/expo/expo/pull/9023) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-app-auth`**
  - Change `unimodulePeerDependencies` to `peerDependencies`
  - Remove `fbjs` dependency
- **`@unimodules/core`**
  - Expo modules applying `unimodules-core.gradle` now automatically depend on `unimodule-test-core` project in Android test flavors if the `src/test` directory exists in the module project. (In packages published to NPM the directory should not be present, so there's no need to change anything in users' projects.) ([#8881](https://github.com/expo/expo/pull/8881) by [@mczernek](https://github.com/mczernek))
  - App delegates can now handle background URL session events via `application:handleEventsForBackgroundURLSession:completionHandler:` method on iOS. ([#8599](https://github.com/expo/expo/pull/8599) by [@lukmccall](https://github.com/lukmccall))
- **`expo-auth-session`**
  - Added missing `peerDependencies`. ([#8821](https://github.com/expo/expo/pull/8821) by [@EvanBacon](https://github.com/EvanBacon))
  - Remove `fbjs` dependency. ([#8821](https://github.com/expo/expo/pull/8821) by [@EvanBacon](https://github.com/EvanBacon))
  - Created `ResponseType.IdToken` for id_token responses. ([#8719](https://github.com/expo/expo/pull/8719) by [@EvanBacon](https://github.com/EvanBacon))
  - `authorizationEndpoint` and `tokenEndpoint` are now optional. ([#8736](https://github.com/expo/expo/pull/8736) by [@EvanBacon](https://github.com/EvanBacon))
  - Added exchange, refresh, and revoke token request methods. ([#8051](https://github.com/expo/expo/pull/8051) by [@EvanBacon](https://github.com/EvanBacon))
  - Remove `assert` in favor of `invariant`. ([#8934](https://github.com/expo/expo/pull/8934) by [@EvanBacon](https://github.com/EvanBacon))
  - Create built-in `providers/google` for easy Google auth. ([#9361](https://github.com/expo/expo/pull/9361) by [@EvanBacon](https://github.com/EvanBacon))
  - Create built-in `providers/facebook` for easy Facebook auth. ([#9361](https://github.com/expo/expo/pull/9361) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-asset`**
  - Add `useAssets` hook to simplify assets handling. ([#8928](https://github.com/expo/expo/pull/8928) by [@bycedric](https://github.com/bycedric))
- **`expo-av`**
  - [av] Delete `prop-types` in favor of TypeScript. ([#8679](https://github.com/expo/expo/pull/8679) by [@EvanBacon](https://github.com/EvanBacon))
  - [av] Directly import `createElement` from `react-native-web` for RNW v12 support. ([#8773](https://github.com/expo/expo/pull/8773) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-barcode-scanner`**
  - Added constants on web. ([#4166](https://github.com/expo/expo/pull/4166) by [@EvanBacon](https://github.com/EvanBacon))
  - Delete `prop-types` in favor of TypeScript. ([#8678](https://github.com/expo/expo/pull/8678) by [@EvanBacon](https://github.com/EvanBacon))
  - `BarCodeScanner` is now returning barcode's bounding box on iOS. ([#8865](https://github.com/expo/expo/pull/8865) by [@lukmccall](https://github.com/lukmccall))
- **`expo-battery`**
  - Remove `fbjs` dependency. ([#8822](https://github.com/expo/expo/pull/8822) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-branch`**
  - Updated `react-native-branch` vendored code to 5.0.0-rc.1, upgraded underlying Branch SDKs, see [`react-native-branch`'s changelog](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution/blob/master/ChangeLog.md) for full list of changes. ([#9625](https://github.com/expo/expo/pull/9625) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-blur`**
  - Delete `prop-types` in favor of TypeScript. ([#8676](https://github.com/expo/expo/pull/8676) by [@EvanBacon](https://github.com/EvanBacon))
  - Convert Android and web to class components. ([#8856](https://github.com/expo/expo/pull/8856) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-brightness`**
  - Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))
  - Create `isAvailableAsync` method. ([#9668](https://github.com/expo/expo/pull/9668) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-calendar`**
  - `createCalendarAsync` now uses default calendar for given `entityType` if `sourceId` parameter (iOS only) is not provided. ([#8570](https://github.com/expo/expo/pull/8570) by [@tsapeta](https://github.com/tsapeta))
  - Create isAvailableAsync method. ([#9641](https://github.com/expo/expo/pull/9641) by [@EvanBacon](https://github.com/EvanBacon))
  - Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-camera`**
  - Added support for QR scanning on web. ([#4166](https://github.com/expo/expo/pull/4166) by [@EvanBacon](https://github.com/EvanBacon))
  - Remove `fbjs` dependency
  - Delete `prop-types` in favor of TypeScript. ([#8680](https://github.com/expo/expo/pull/8680) by [@EvanBacon](https://github.com/EvanBacon))
  - [camera] Directly import `createElement` from `react-native-web` for RNW v12 support. ([#8773](https://github.com/expo/expo/pull/8773) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-contacts`**
  - Added `isAvailableAsync()` method for guarding against web usage. ([#9640](https://github.com/expo/expo/pull/9640) by [@EvanBacon](https://github.com/evanbacon))
  - Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-facebook`**
  - Added method to get Facebook authentication state. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
  - Added method to log out of Facebook `logOutAsync()`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- **`expo-gl`**
  - Full rewrite of expo-gl-cpp, migration to JSI. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))
  - Introduced compatibility with Hermes, however you should treat this feature as unstable so use it with Hermes at your own risk. ([#7948](https://github.com/expo/expo/pull/7948) by [@wkozyra95](https://github.com/wkozyra95))
  - Enable stencil buffer on Android ([#9928](https://github.com/expo/expo/pull/9928) by [@wkozyra95](https://github.com/wkozyra95))
- **`expo-image-picker`**
  - Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))
  - Added `videoMaxDuration` option to `launchCameraAsync()` to configure video recording duration limit. ([#9486](https://github.com/expo/expo/pull/9486) by [@barthap](https://github.com/barthap))
  - Added a way to handle results when activity was killed by the android. ([#9697](https://github.com/expo/expo/pull/9697) by [@lukmccall](https://github.com/lukmccall))
- **`expo-linear-gradient`**
  - Remove `prop-types` ([#8681](https://github.com/expo/expo/pull/8681) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-localization`**
  - Added doc blocks for everything. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
  - Added support for SSR environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
  - `Localization.isRTL` defaults to `false` in node environments. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-location`**
  - Added missing `altitudeAccuracy` to the location object on Android (requires at least Android 8.0). ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Improved support for Web — added missing methods for requesting permissions and getting last known position. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Added `maxAge` and `requiredAccuracy` options to `getLastKnownPositionAsync`. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Google Maps Geocoding API can now be used on all platforms with the new `useGoogleMaps` option. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))
  - Added `district`, `subregion` and `timezone` values to reverse-geocoded address object. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))
- **`expo-media-library`**
  - Added `options` to `getAssetInfoAsync()`, which allows specifying whether to download the asset from network in iOS. ([#9405](https://github.com/expo/expo/pull/9405) by [@jarvisluong](https://github.com/jarvisluong))
  - Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))
  - Add permissions for web. ([#9671](https://github.com/expo/expo/pull/9671) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-screen-capture`**
  - Added `addScreenshotListener` and `removeScreenshotListener` methods so you can take action in your app whenever a user takes a screenshot. ([#9747](https://github.com/expo/expo/pull/9747) by [@cruzach](https://github.com/cruzach))
- **`expo-notifications`**
  - Added support for including foreign (non-`expo-notifications`-created) notifications in `getPresentedNotificationsAsync` on Android. ([#8614](https://github.com/expo/expo/pull/8614) by [@sjchmiela](https://github.com/sjchmiela))
  - Added `IosAuthorizationStatus.EPHEMERAL`, an option that maps to `UNAuthorizationStatusEphemeral` for compatibility with iOS 14. ([#8938](https://github.com/expo/expo/pull/8938) by [@ide](https://github.com/ide))
  - Added support for custom large icon on the Android. ([#9116](https://github.com/expo/expo/pull/9116) by [@lukmccall](https://github.com/lukmccall))
  - Added `sticky` property, which defines if notification can be dismissed by swipe. ([#9351](https://github.com/expo/expo/pull/9351) by [@barthap](https://github.com/barthap))
  - Added Notification categories functionality to allow for interactive push notifications on Android and iOS! ([#9015](https://github.com/expo/expo/pull/9015) by [@cruzach](https://github.com/cruzach))
  - Added support for channels to local notifications. ([#9385](https://github.com/expo/expo/pull/9385) by [@lukmccall](https://github.com/lukmccall))
  - Added permissions support for web. ([#9576](https://github.com/expo/expo/pull/9576) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-random`**
  - Add a synchronous version of `getRandomBytesAsync` called `getRandomBytes`. ([#9750](https://github.com/expo/expo/pull/9750) by [@brentvatne](https://github.com/brentvatne))
- **`expo-secure-store`**
  - Create `isAvailableAsync` method. ([#9668](https://github.com/expo/expo/pull/9668) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-speech`**
  - Added constant `Speech.maxSpeechInputLength` - returns maximum input text length for `Speech.speak()`. ([#9243](https://github.com/expo/expo/pull/9243) by [@barthap](https://github.com/barthap))
- **`expo-permissions`**
  - Add `usePermissions` hook to simplify permission handling. ([#8788](https://github.com/expo/expo/pull/8788) by [@bycedric](https://github.com/bycedric))
  - Added support for the limited `CAMERA_ROLL` permission on iOS 14. ([#9423](https://github.com/expo/expo/pull/9423) by [@lukmccall](https://github.com/lukmccall))
- **`expo-web-browser`**
  - Added `locked` state to `openBrowserAsync`. ([#9254](https://github.com/expo/expo/pull/9254) by [@EvanBacon](https://github.com/EvanBacon))
  - Add `secondaryToolbarColor` (Android) flag for `WebBrowser` ([#8615](https://github.com/expo/expo/pull/8615) by [@jdanthinne](https://github.com/jdanthinne)))

### 🐛 Bug fixes

- When debugging JS remotely console logs are now displayed only in the browser console (instead of both in the browser and CLI console). ([#8807](https://github.com/expo/expo/pull/8807) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-auth-session`**
  - Added custom `Platform.isDOMAvailable` pending `@unimodules/react-native-adapter` update. ([#8934](https://github.com/expo/expo/pull/8934) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-asset`**
  - Fixed `Asset.loadAsync()` TypeScript signature to match `Asset.fromModule()` types. ([#9246](https://github.com/expo/expo/pull/9246) by [@barthap](https://github.com/barthap))
- **`expo-background-fetch`**
  - Added some safety checks to prevent `NullPointerExceptions` on Android. ([#8864](https://github.com/expo/expo/pull/8864) by [@mczernek](https://github.com/mczernek))
  - Usage fails correctly on web. ([#9661](https://github.com/expo/expo/pull/9661) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-av`**
  - Allow playing media files embedded as resources in an Android APK. ([#8936](https://github.com/expo/expo/pull/8936) by [@esamelson](https://github.com/esamelson))
  - Fix stability issues when changing source and/or useNativeControls on iOS. ([#9381](https://github.com/expo/expo/pull/9381) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix stability issue due to player-item observers not cleaned up on iOS. ([#9350](https://github.com/expo/expo/pull/9350) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix audio recording not working after reload app in iOS. ([#9283](https://github.com/expo/expo/pull/9283) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix native fullscreen events not emitted on iOS. ([#9323](https://github.com/expo/expo/pull/9323) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix duplicate full-screen will-dismiss event on iOS. ([#9366](https://github.com/expo/expo/pull/9366) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix mem-leak when unmounting Video component on iOS. ([#9379](https://github.com/expo/expo/pull/9379) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix audio not resumable when app is in background on iOS (react-native-music-control usage). ([#9363](https://github.com/expo/expo/pull/9363) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix posterStyle warning. ([#9384](https://github.com/expo/expo/pull/9384) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix audio-session not de-activated after unloading sound on iOS. ([#9365](https://github.com/expo/expo/pull/9365) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix debugger break in XCode when removing observations. ([#9334](https://github.com/expo/expo/pull/9334) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Removed unused and potentionally unsafe call on iOS. ([#9436](https://github.com/expo/expo/pull/9436) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix onReadyForDisplay not emitted for HLS streams/m3u8 files on iOS. ([#9443](https://github.com/expo/expo/pull/9443) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix progress events when no playback is active on Android. ([#9545](https://github.com/expo/expo/pull/9545) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix Video resizeMode not updated on Android. ([#9567](https://github.com/expo/expo/pull/9567) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix Video source always reloaded when changing props on Android. ([#9569](https://github.com/expo/expo/pull/9569) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix blank Video after unlocking screen. ([#9586](https://github.com/expo/expo/pull/9586) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix exception on Android when loading invalid Video source. ([#9596](https://github.com/expo/expo/pull/9596) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix Audio prepareToRecordAsync after it failed once on iOS. ([#9612](https://github.com/expo/expo/pull/9612) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Improve error-messages on iOS. ([#9618](https://github.com/expo/expo/pull/9618) by [@IjzerenHein](https://github.com/IjzerenHein))
- **`expo-barcode-scanner`**
  - Fixed scanner throwing `NullPointerException` when barcode type isn't recognized on Android. ([#9006](https://github.com/expo/expo/pull/9006) by [@lukmccall](https://github.com/lukmccall))
- **`expo-calendar`**
  - Fix `Calendar.getEventsAsync` crashing when `recurrenceRules` are incorrect. ([#8760](https://github.com/expo/expo/pull/8760) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `Calendar.createEventAsync` crashing when `alarms` were set or `endTimeZone` was null. ([#9269](https://github.com/expo/expo/pull/9269) by [@barthap](https://github.com/barthap))
- **`expo-camera`**
  - Fix QR scanning on Android and iOS. ([#9741](https://github.com/expo/expo/pull/9741) by [@EvanBacon](https://github.com/EvanBacon))
  - [web] Fix bug where swapping cameras caused screen to flicker ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
  - [web] Fix bug where swapping cameras doesn't persist camera settings ([#9558](https://github.com/expo/expo/pull/9558) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-contacts`**
  - Fixed `getContactById` not resolving promise when contact with provided id doesn't exist on Android. ([#8976](https://github.com/expo/expo/pull/8976) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `addContactAsync` returning incorrect id on Android. ([#8980](https://github.com/expo/expo/pull/8980) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `updateContactAsync` creating a new contact on Android. ([#9031](https://github.com/expo/expo/pull/9031) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `updateContactAsync` not returning a contact id on iOS. ([#9031](https://github.com/expo/expo/pull/9031) by [@lukmccall](https://github.com/lukmccall))
  - Fixed bug, where sorting contacts by `firstName` or `lastName` could cause crash on Android. ([#9582](https://github.com/expo/expo/pull/9582) by [@barthap](https://github.com/barthap))
- **`expo-device`**
  - Remove "request install packages" permission to make it opt-in. ([#8969](https://github.com/expo/expo/pull/8969) by [@bycedric](https://github.com/bycedric))
- **`expo-document-picker`**
  - Fixed `getDocumentAsync` crashing when picking a folder on iOS. ([#8930](https://github.com/expo/expo/pull/8930) by [@lukmccall](https://github.com/lukmccall))
  - Fixed iOS bug, where it could be impossible to select only videos. ([#9720](https://github.com/expo/expo/pull/9720) by [@barthap](https://github.com/barthap))
- **`expo-error-recovery`**
  - Fixes localStorage access SecurityError ([#9257](https://github.com/expo/expo/pull/9257) by [@tommybru](https://github.com/tommybru) and [@fiberjw](https://github.com/fiberjw))
- **`expo-file-system`**
  - Fix background URL session completion handler not being called. ([#8599](https://github.com/expo/expo/pull/8599) by [@lukmccall](https://github.com/lukmccall))
  - Fix compilation error on macOS Catalyst ([#9055](https://github.com/expo/expo/pull/9055) by [@andymatuschak](https://github.com/andymatuschak))
  - Fixed `uploadAsync` native signature on Android. ([#9076](https://github.com/expo/expo/pull/9076) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `uploadAsync` throwing `Double cannot be cast to Integer` on Android. ([#9076](https://github.com/expo/expo/pull/9076) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `getInfo` returning incorrect size when provided path points to a folder. ([#9063](https://github.com/expo/expo/pull/9063) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `uploadAsync()` returning empty response on iOS. ([#9166](https://github.com/expo/expo/pull/9166) by [@barthap](https://github.com/barthap))
  - Added docs about Android permissions and removed old storage permission. ([#9447](https://github.com/expo/expo/pull/9447) by [@bycedric](https://github.com/bycedric))
- **`expo-gl`**
  - Delete `prop-types` in favor of TypeScript. ([#8675](https://github.com/expo/expo/pull/8675) by [@EvanBacon](https://github.com/EvanBacon))
  - Fix crashes on iOS14 caused by different integer representation in the new JSC. ([#9226](https://github.com/expo/expo/pull/9226) by [@wkozyra95](https://github.com/wkozyra95))
  - Fix bug preventing GLView from rendering in SSR environments. ([#9691](https://github.com/expo/expo/pull/9691) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-google-app-auth`**
  - Fix bug where user cancel on iOS threw an error instead of returning dismissed event. ([#8685](https://github.com/expo/expo/pull/8685) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-font`**
  - Fixed fonts not being loaded in Internet Explorer. ([#8652](https://github.com/expo/expo/pull/8652) by [@d4rky-pl](https://github.com/d4rky-pl))
- **`expo-image-picker`**
  - Fixed downsizing cropped image, when `allowsEditing` was `true`. ([#9316](https://github.com/expo/expo/pull/9316) by [@barthap](https://github.com/barthap))
  - Return array of `ImagePickerResult` when `allowsMultipleSelection` is set to `true` on Web. ([#9402](https://github.com/expo/expo/pull/9402) by [@isthaison](https://github.com/isthaison))
- **`expo-linear-gradient`**
  - Renamed type export `LinearGradienPoint` to `LinearGradientPoint`. ([#8673](https://github.com/expo/expo/pull/8673) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-localization`**
  - `Localization.region` now returns `null` when a partial `locale` is defined by the browser on web. ([#8824](https://github.com/expo/expo/pull/8824) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-local-authentication`**
  - Fix crash when `NSFaceIDUsageDescription` is not provided and device fallback is disabled. ([#8595](https://github.com/expo/expo/pull/8595) by [@tsapeta](https://github.com/tsapeta))
  - Added missing biometric permission to Android. ([#8692](https://github.com/expo/expo/pull/8692) by [@byCedric](https://github.com/byCedric))
  - Use hardcoded system feature strings to support Android SDK 28. ([#9034](https://github.com/expo/expo/pull/9034) by [@bycedric](https://github.com/bycedric))
- **`expo-mail-composer`**
  - Fixed a bug on Android where calling `composeAsync` in the bare workflow with an attachment would result in an error. ([#8524](https://github.com/expo/expo/pull/8524) by [@cruzach](https://github.com/cruzach))
  - Fixed attachment `mimeType` for unknown file extensions. ([#9279](https://github.com/expo/expo/pull/9279) by [@barthap](https://github.com/barthap))
- **`expo-location`**
  - Added some safety checks to prevent `NullPointerExceptions` in background location on Android. ([#8864](https://github.com/expo/expo/pull/8864) by [@mczernek](https://github.com/mczernek))
  - Add `isoCountryCode` to `Address` type and reverse lookup. ([#8913](https://github.com/expo/expo/pull/8913) by [@bycedric](https://github.com/bycedric))
  - Fix geocoding requests not resolving/rejecting on iOS when the app is in the background or inactive state. It makes it possible to use geocoding in such app states, however it's still discouraged. ([#9178](https://github.com/expo/expo/pull/9178) by [@tsapeta](https://github.com/tsapeta))
  - Fixed different types being used on Web platform. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - `getLastKnownPositionAsync` no longer requests for the current location on iOS and just returns the last known one as it should be. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Fixed `getCurrentPositionAsync` not resolving on Android when the lowest accuracy is used. ([#9251](https://github.com/expo/expo/pull/9251) by [@tsapeta](https://github.com/tsapeta))
  - Fixed `LocationGeocodedAddress` type to reflect the possibility of receiving `null` values. ([#9444](https://github.com/expo/expo/pull/9444) by [@tsapeta](https://github.com/tsapeta))
- **`expo-media-library`**
  - Handled the crash when calling `getAssetInfoAsync` on a slow motion video on iOS. ([#8802](https://github.com/expo/expo/pull/8802) by [@jarvisluong](https://github.com/jarvisluong))
  - Fixed `getAssetsAsync()` and `getAssetInfoAsync()` location issues on Android Q. ([#9315](https://github.com/expo/expo/pull/9315) by [@barthap](https://github.com/barthap))
  - Fixed `getAssetsAsync` crashes when given invalid `after` value on Android. ([#9466](https://github.com/expo/expo/pull/9466) by [@barthap](https://github.com/barthap))
  - Fixed validation for input arguments of `getAssetsAsync`. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
  - Fixed bug, where `getAssetsAsync` did not reject on error on Android. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
  - Fixed `getAlbumsAsync()`, `getAlbum()` and media change listener crashing on Android 10. ([#9666](https://github.com/expo/expo/pull/9666) by [@barthap](https://github.com/barthap))
  - Fixed handling albums without name on Android. ([#9787](https://github.com/expo/expo/pull/9787) by [@barthap](https://github.com/barthap))
- **`expo-payments-stripe`**
  - Upgraded `Stripe` pod on iOS to fix compatibility with Xcode 11.4. Now you can also customize the version of `Stripe` pod installed by setting `$StripeVersion` variable in your `Podfile`. ([#8594](https://github.com/expo/expo/pull/8594) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed misuse of the native module that caused an unhandled Promise being rejected when `cancelApplePayRequestAsync` was called. ([#8864](https://github.com/expo/expo/pull/8864) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-notifications`**
  - Fixed `getExpoPushTokenAsync` rejecting when `getDevicePushTokenAsync`'s `Promise` hasn't fulfilled yet (and vice versa). Probably also added support for calling these methods reliably with Fast Refresh enabled. ([#8608](https://github.com/expo/expo/pull/8608) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed compatibility with `expo-permissions` below `9.0.0` (the _duplicate symbols_ problem). ([#8753](https://github.com/expo/expo/pull/8753) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed total incompatibility with the web platform – calling unsupported methods will now throw a readable `UnavailabilityError`. ([#8853](https://github.com/expo/expo/pull/8853) by [@sjchmiela](https://github.com/sjchmiela))
  - Fix notifications not being displayed after five minutes of phone inactivity on Android. ([#9287](https://github.com/expo/expo/pull/9287) by [@mczernek](https://github.com/mczernek))
  - Include `content-type: application/json` when requesting an Expo push token ([#9332](https://github.com/expo/expo/pull/9332) by @ide)
  - Export `NotificationPermissions.types` to make `Notifications.IosAuthorizationStatus` available. ([#8747](https://github.com/expo/expo/pull/8747) by [@brentvatne](https://github.com/brentvatne))
  - Fixed remote notifications ignoring the `channelId` parameter. ([#9080](https://github.com/expo/expo/pull/9080) by [@lukmccall](https://github.com/lukmccall))
  - Fixed malformed data object on iOS. ([#9164](https://github.com/expo/expo/pull/9164) by [@lukmccall](https://github.com/lukmccall))
  - Fixed case where iOS notification category would not be set on the very first call to `setNotificationCategoryAsync`. ([#9515](https://github.com/expo/expo/pull/9515) by [@cruzach](https://github.com/cruzach))
  - Fixed notification response listener not triggering in the managed workflow on iOS when app was completely killed ([#9478](https://github.com/expo/expo/pull/9478) by [@cruzach](https://github.com/cruzach))
  - Fixed notifications being displayed when `shouldShowAlert` was `false` on Android. ([#9563](https://github.com/expo/expo/pull/9563) by [@barthap](https://github.com/barthap))
  - Fixed `Application Not Responding` occurring in the Google Play Console. ([#9792](https://github.com/expo/expo/pull/9792) by [@lukmccall](https://github.com/lukmccall))
- **`expo-screen-orientation`**
  - Fix `ScreenOrientation.getOrientationAsync` returning a wrong value when the application is starting. ([#8727](https://github.com/expo/expo/pull/8727) by [@lukmccall](https://github.com/lukmccall))
- **`expo-secure-store`**
  - Fix incorrect security attribute applied when using the flag WHEN_UNLOCKED_THIS_DEVICE_ONLY on iOS ([#9264](https://github.com/expo/expo/pull/9264) by [@cjthompson](https://github.com/cjthompson))
- **`expo-sensors`**
  - Ensure browser globals `DeviceMotionEvent` and `DeviceOrientationEvent` exist before attempting to read from them. ([#9236](https://github.com/expo/expo/pull/9236) by [@evanbacon](https://github.com/evanbacon))
  - Fixed bug with low Barometer resolution on iOS. ([#9441](https://github.com/expo/expo/pull/9441) by [@barthap](https://github.com/barthap))
- **`expo-sharing`**
  - Fixed sharing external URIs on Android. ([#9223](https://github.com/expo/expo/pull/9223) by [@barthap](https://github.com/barthap))
- **`expo-speech`**
  - Fixed issue where Speech failed on Android when input text was too long. ([#9243](https://github.com/expo/expo/pull/9243) by [@barthap](https://github.com/barthap))
- **`expo-permissions`**
  - Ensure browser globals `DeviceMotionEvent` and `DeviceOrientationEvent` exist before attempting to read from them. ([#9236](https://github.com/expo/expo/pull/9236) by [@evanbacon](https://github.com/evanbacon))
  - Fixed `askAsync` rejecting with `permission cannot be null or empty` in the bare workflow. ([#8910](https://github.com/expo/expo/pull/8910) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `getPermissionsAsync` returning incorrect status in the Expo Client app on iOS. ([#9060](https://github.com/expo/expo/pull/9060) by [@lukmccall](https://github.com/lukmccall))
  - Remove require cycle for `usePermissions` hook. ([#9219](https://github.com/expo/expo/pull/9219) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-sqlite`**
  - Fix incorrect `rowsAffected` value in result of `executeSql` method on iOS when deleting/updating cascadely. ([@9137](https://github.com/expo/expo/pull/9317) by [@mczernek](https://github.com/mczernek))
- **`expo-sms`**
  - Fixed rare crashes on iOS caused by `MFMessageComposeViewController` being initialized not from the main thread. ([#8575](https://github.com/expo/expo/pull/8575) by [@tsapeta](https://github.com/tsapeta))
- **`expo-store-review`**
  - [store-review] Fix doc blocks. ([#8714](https://github.com/expo/expo/pull/8714) by [@EvanBacon](https://github.com/EvanBacon))
  - Implemented native [In-App Review](https://developer.android.com/guide/playcore/in-app-review) for Android. ([#9607](https://github.com/expo/expo/pull/9607) by [@spezzino](https://github.com/spezzino))
- **`expo-task-manager`**
  - Added some safety checks to prevent `NullPointerExceptions` on Android. ([#8864](https://github.com/expo/expo/pull/8864) by [@mczernek](https://github.com/mczernek))
  - Fix tasks not being removed from memory when unregistering them. ([#8612](https://github.com/expo/expo/pull/8612) by [@mczernek](https://github.com/mczernek))
- **`expo-web-browser`**
  - Fix native Android dependencies used in tests - Kotlin and testing libraries. ([#8881](https://github.com/expo/expo/pull/8881) by [@mczernek](https://github.com/mczernek))
  - Removed unncecessary Android dependencies. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
  - Fixed `openAuthSessionAsync` crashing when cancelled on iOS. ([#9722](https://github.com/expo/expo/pull/9722) by [@barthap](https://github.com/barthap))
  - Improve error message when something goes very wrong while loading an app in Expo client ([#10239](https://github.com/expo/expo/pull/10239) by [@brentvatne](https://github.com/brentvatne))

## 38.0.0

### 📚 3rd party library updates

- Updated `react-native` from `0.61.4` to `0.62.2`. ([#8310](https://github.com/expo/expo/pull/8310), [#8542](https://github.com/expo/expo/pull/8542) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `react-native-screens` from `2.2.0` to `2.9.0`. ([#8434](https://github.com/expo/expo/pull/8424) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `react-native-shared-element` from `0.5.6` to `0.7.0`. ([#8427](https://github.com/expo/expo/pull/8427) by [@IjzerenHein](https://github.com/IjzerenHein))
- Updated `react-native-reanimated` from `1.7.0` to `1.9.0`. ([#8424](https://github.com/expo/expo/pull/8424) by [@sjchmiela](https://github.com/sjchmiela))
- Updated `react-native-safe-area-context` from `0.7.3` to `3.0.0`. ([#8459](https://github.com/expo/expo/pull/8459), [#8479](https://github.com/expo/expo/pull/8479), [#8549](https://github.com/expo/expo/pull/8549) by [@brentvatne](https://github.com/brentvatne) and [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/datetimepicker` from `2.2.2` to `2.4.0`. ([#8476](https://github.com/expo/expo/pull/8476) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-webview` from `8.1.1` to `9.4.0`. ([#8489](https://github.com/expo/expo/pull/8489) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-svg` from `11.0.1` to `12.1.0`. ([#8491](https://github.com/expo/expo/pull/8491) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-maps` from `0.26.1` to `0.27.1`. ([#8495](https://github.com/expo/expo/pull/8495) by [@esamelson](https://github.com/esamelson))
- Updated `@react-native-community/netinfo` from `5.5.1` to `5.9.2`. ([#8499](https://github.com/expo/expo/pull/8499) by [@esamelson](https://github.com/esamelson))
- Updated `@react-native-community/masked-view` from `0.1.6` to `0.1.10`. ([#8499](https://github.com/expo/expo/pull/8499) by [@esamelson](https://github.com/esamelson))

### 🛠 Breaking changes

- `react-native-view-shot` is no longer installed by default, install it with `expo install react-native-view-shot`. ([#7950](https://github.com/expo/expo/pull/7950) by [@evanbacon](https://github.com/evanbacon))
- The AR module has been removed from the `expo` package. See https://expo.fyi/deprecating-ar for more information. ([#8442](https://github.com/expo/expo/pull/8442) by [@sjchmiela](https://github.com/sjchmiela))
- Importing `Linking` from `expo` package is now deprecated. Use `expo-linking` module instead. ([#8659](https://github.com/expo/expo/pull/8659) by [@tsapeta](https://github.com/tsapeta))
- **`expo-battery`**
  - Removed deprecated `isSupported` method. ([#7206](https://github.com/expo/expo/pull/7206) by [@bbarthec](https://github.com/bbarthec))
- **`expo-camera`**
  - The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-file-system`**
  - `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` work by default when the app is in background too — they won't reject when the application is backgrounded. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
  - `FileSystem.downloadAsync` and `FileSystem.DownloadResumable` will reject when invalid headers dictionary is provided. These methods accept only `Record<string, string>`. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
  - `FileSystem.getContentUriAsync` now returns a string. ([#7192](https://github.com/expo/expo/pull/7192) by [@lukmccall](https://github.com/lukmccall))
- **`expo-image-manipulator`**
  - The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-image-picker`**
  - The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-print`**
  - The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-secure-store`**
  - The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-sensors`**
  - `DeviceMotion.addListener` emits events with `rotationRate` in degrees instead of radians on all platforms. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
  - `DeviceMotion.addListener` emits events with `rotationRate` in the form of alpha = x, beta = y, gamma = z on all platforms. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
- **`expo-permissions`**
  - Removed support for fetching notifications-related permissions (they have been moved to `expo-notifications` package). You no longer will be able to call `getAsync` or `askAsync` with `.NOTIFICATIONS` or `.USER_FACING_NOTIFICATIONS` without having `expo-notifications` package installed. ([#8486](https://github.com/expo/expo/pull/8486) by [@sjchmiela](https://github.com/sjchmiela))

### 🎉 New features

- Initial release of **`expo-screen-capture`** 🥳
- Initial release of **`expo-notifications`** 🥳
- Added `@react-native-community/segmented-control` in version `1.6.1`. ([#8038](https://github.com/expo/expo/pull/8038) by [@marchenk0va](https://github.com/marchenk0va) and [#8441](https://github.com/expo/expo/pull/8441) by [@tsapeta](https://github.com/tsapeta))
- Added `@react-native-community/slider` version `3.0.0`. ([#8451](https://github.com/expo/expo/pull/8451) by [@brentvatne](https://github.com/brentvatne))
- Added `@react-native-community/picker` version `1.6.0`. ([#8451](https://github.com/expo/expo/pull/8451) by [@brentvatne](https://github.com/brentvatne))
- Added `@react-native-community/async-storage` support for version `1.11.0`. ([@react-native-community/async-storage#368](https://github.com/react-native-community/async-storage/pull/368))
- **`expo-apple-authentication`**
  - Add 'Sign up with Apple' option (available as of iOS 13.2). ([#7471](https://github.com/expo/expo/pull/7471) by [@IjzerenHein](https://github.com/IjzerenHein))
- **`expo-file-system`**
  - Add `FileSystem.uploadAsync` method. ([#7380](https://github.com/expo/expo/pull/7380) by [@lukmccall](https://github.com/lukmccall))
  - Add ability to read Android `raw` and `drawable` resources in `FileSystem.getInfoAsync`, `FileSystem.readAsStringAsync`, and `FileSystem.copyAsync`. ([#8104](https://github.com/expo/expo/pull/8104) by [@esamelson](https://github.com/esamelson))
- **`expo-face-detector`**
  - Added support for overriding the iOS Firebase SDK version in the bare workflow. ([#7141](https://github.com/expo/expo/pull/7141) by [@IjzerenHein](https://github.com/IjzerenHein))
- **`expo-firebase-analytics`**
  - Add `setDebugModeEnabled` for enabling DebugView on the Expo client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))
- **`expo-gl`**
  - Improved logging and added some more logging options. ([#7550](https://github.com/expo/expo/pull/7550) by [@tsapeta](https://github.com/tsapeta))
  - Add WebP format as an option when taking GL snapshots (Android only). ([#7490](https://github.com/expo/expo/pull/7490) by [@pacoelayudante](https://github.com/pacoelayudante))
- **`expo-local-authentication`**
  - Added support for `promptMessage`, `cancelLabel` and `disableDeviceFallback` on Android. ([#8219](https://github.com/expo/expo/pull/8219) by [@diegolmello](https://github.com/diegolmello))
  - Added iris local authentication type for Android. ([#8431](https://github.com/expo/expo/pull/8364) by [@bycedric](https://github.com/bycedric))
- **`expo-sms`**
  - Add `attachments` as an optional parameter to `sendSMSAsync`. It can be used to provide an attachment along with the recipients and message arguments. ([#7967](https://github.com/expo/expo/pull/7967) by [@thorbenprimke](https://github.com/thorbenprimke))
- **`expo-sensors`**
  - `DeviceMotion.addListener` emits events with `interval` property. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
- **`expo-web-browser`**
  - Add `readerMode` and `dismissButtonStyle` (iOS) and `enableDefaultShare` (Android) flags for `WebBrowser` ([#7221](https://github.com/expo/expo/pull/7221) by [@LinusU](https://github.com/LinusU)) & [@mczernek](https://github.com/mczernek))
- **`expo-camera`**
  - Added exports for TypeScript definitions: CameraType, ImageType, ImageParameters, ImageSize, CaptureOptions, CapturedPicture ([#8457](https://github.com/expo/expo/pull/8457) by [@jarvisluong](https://github.com/jarvisluong))
- **`expo-permissions`**
  - If permission is not recognized, show the correct expo package to link. ([#8546])(https://github.com/expo/expo/pull/8046) by [@jarvisluong](https://github.com/jarvisluong)

### 🐛 Bug fixes

- Fixed `androidNavigationBar.hidden` configuration not remaining applied after backgrounding & foregrounding the app. ([#7770](https://github.com/expo/expo/pull/7770) by [@cruzach](https://github.com/cruzach))
- **`@unimodules/core`**
  - Fixed error when serializing a `Map` containing a `null` ([#8153](https://github.com/expo/expo/pull/8153) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed a rare undetermined behavior that may have been a result of misuse of `dispatch_once_t` on iOS ([#7576](https://github.com/expo/expo/pull/7576) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed error when serializing a `Map` containing a `Bundle` ([#8068](https://github.com/expo/expo/pull/8068) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed _unused variable_ warnings in `UMAppDelegateWrapper` ([#8467](https://github.com/expo/expo/pull/8467) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed a bug in `UMAppDelegateWrapper` when it's used with Swift. ([#8526](https://github.com/expo/expo/pull/8526) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-av`**
  - Fix unable to call presentFullScreenPlayer twice. ([#8343](https://github.com/expo/expo/pull/8343) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fixed multiplied callbacks in `expo-av` after replaying ([#7193](https://github.com/expo/expo/pull/7193) by [@mczernek](https://github.com/mczernek))
  - Fixed `Plaback.loadAsync()` return type. ([#7559](https://github.com/expo/expo/pull/7559) by [@awinograd](https://github.com/awinograd))
  - Fixed the adaptive streaming for exoplayer on android. ([#8380](https://github.com/expo/expo/pull/8363) by [@watchinharrison](https://github.com/watchinharrison))
- **`expo-auth-session`**
  - Fix `AuthSession.getDefaultReturnUrl()` returning wrong URL while using release channels. ([#7687](https://github.com/expo/expo/pull/7687) by [@lukmccall](https://github.com/lukmccall))
- **`expo-brightness`**
  - Fixed `Brightness.requestPermissionsAsync` throwing `permission cannot be null or empty` error on Android. ([#7276](https://github.com/expo/expo/pull/7276) by [@lukmccall](https://github.com/lukmccall))
- **`expo-calendar`**
  - Fixed `Calendar.getCalendarsAsync` requiring not needed permissions on iOS. ([#7928](https://github.com/expo/expo/pull/7928) by [@lukmccall](https://github.com/lukmccall))
  - Fix `recurrence rule` and `event` parsing. ([#7527](https://github.com/expo/expo/pull/7527) by [@lukmccall](https://github.com/lukmccall))
- **`expo-constants`**
  - Fixed `uuid`'s deprecation of deep requiring ([#8114](https://github.com/expo/expo/pull/8114) by [@actuallymentor](https://github.com/actuallymentor))
- **`expo-contacts`**
  - Fix `Contacts.presentFormAsync` pre-filling. ([#7285](https://github.com/expo/expo/pull/7285) by [@abdelilah](https://github.com/abdelilah) & [@lukmccall](https://github.com/lukmccall))
- **`expo-firebase-analytics`**
  - Fix no events recorded on the Expo client when running on certain Android devices. ([#7679](https://github.com/expo/expo/pull/7679) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fix `setAnalyticsCollectionEnabled` throwing an error.
  - Fixes & improvements to the pure JS analytics client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Fixed logEvent in `expo-firebase-analytics` for Android. logEvent's optional properties parameter was causing a NPE on Android when not provided. ([#7897](https://github.com/expo/expo/pull/7897) by [@thorbenprimke](https://github.com/thorbenprimke))
  - Fixes `parseEvent` and `parseUserProperty` to allow numeric characters in the name parameter. ([#8516](https://github.com/expo/expo/pull/8516) by [@thorbenprimke](https://github.com/thorbenprimke))
- **`expo-font`**
  - Fixed timeout on Firefox [#7420](https://github.com/expo/expo/pull/7420)
- **`expo-gl`**
  - Fix crash in React Native 0.62 when creating a context. ([#8352](https://github.com/expo/expo/pull/8352) by [@wkozyra95](https://github.com/wkozyra95))
  - Allow createElement & unstable_createElement usage for web. ([#7995](https://github.com/expo/expo/pull/7995) by [@wood1986](https://github.com/wood1986))
  - Fix depth/stencil buffers not working correctly with `three.js`. ([#7543](https://github.com/expo/expo/pull/7543) by [@tsapeta](https://github.com/tsapeta))
- **`expo-keep-awake`**
  - Fixed `KeepAwake.activateKeepAwake` not working with multiple tags on Android. ([#7197](https://github.com/expo/expo/pull/7197) by [@lukmccall](https://github.com/lukmccall))
- **`expo-image-picker`**
  - Fixed exception when calling `ImagePicker.getCameraPermissionsAsync` on Web. ([#7498](https://github.com/expo/expo/pull/7498) by [@IjzerenHein](https://github.com/IjzerenHein))
  - Skip asking for camera permissions on web with `ImagePicker.getCameraPermissionsAsync`. ([#8475](https://github.com/expo/expo/pull/8475) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-localization`**
  - Fixed `Localization.locale` throwing an exception on the iOS simulator. ([#8193](https://github.com/expo/expo/pull/8193) by [@lukmccall](https://github.com/lukmccall))
- **`expo-media-library`**
  - Added missing image loader for `MediaLibrary` in bare workflow. ([#8304](https://github.com/expo/expo/pull/8304) by [@tsapeta](https://github.com/tsapeta))
  - Fixed `MediaLibrary` not compiling with the `use_frameworks!` option in the bare React Native application. ([#7861](https://github.com/expo/expo/pull/7861) by [@Ashoat](https://github.com/Ashoat))
  - Flip dimensions based on media rotation data on Android to match `<Image>` and `<Video>` as well as iOS behavior. ([#7980](https://github.com/expo/expo/pull/7980) by [@Ashoat](https://github.com/Ashoat))
- **`expo-permissions`**
  - Fix permissions in the headless mode. ([#7962](https://github.com/expo/expo/pull/7962) by [@lukmccall](https://github.com/lukmccall))
  - Fixed `permission cannot be null or empty` error when asking for `WRITE_SETTINGS` permission on Android. ([#7276](https://github.com/expo/expo/pull/7276) by [@lukmccall](https://github.com/lukmccall))
  - Fixed a rare undetermined behavior that may have been a result of misuse of `dispatch_once_t` on iOS ([#7576](https://github.com/expo/expo/pull/7576) by [@sjchmiela](https://github.com/sjchmiela))
  - Fixed `Permissions.NOTIFICATIONS` was granted even if notifications were disabled. ([#8539](https://github.com/expo/expo/pull/8539) by [@lukmccall](https://github.com/lukmccall))
- **`expo-screen-orientation`**
  - Fixed `ScreenOrientation.addOrientationChangeListener` payload to match docs. ([#7774](https://github.com/expo/expo/pull/7774) by [@awinograd](https://github.com/awinograd))
  - Fixed `ScreenOrientation.lockAsync` to properly convert to web platform equivalent of chosen lock. ([#7774](https://github.com/expo/expo/pull/7774) by [@awinograd](https://github.com/awinograd))
- **`expo-sensors`**
  - All sensors use more precise gravity `9.80665` instead of `9.8`. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
- **`expo-web-browser`**
  - Fix `WebBrowser` sending `dismiss` before opening. ([#6743](https://github.com/expo/expo/pull/6743) by [@LucaColonnello](https://github.com/LucaColonnello))
- **`unimodules-app-loader`**
  - Fixed `appLoaderRegisteredForName` to not only check if a loader class name is in the cache for the provided name but also verifies that the cached and current class name match. When migrating from managed to bare, the class name cache needs to be updated. ([#8292](https://github.com/expo/expo/pull/8292) by [@thorbenprimke](https://github.com/thorbenprimke))
- **`expo-local-authentication`**
  - Added estimate of supported authentication types for Android. ([#8431](https://github.com/expo/expo/pull/8431) by [@bycedric](https://github.com/bycedric))
- **`@unimodules/react-native-adapter`**
  - Made it possible for SSR (node) environments that don't bundle using platform extensions to work without resolving native code. ([#8502](https://github.com/expo/expo/pull/8502) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-background-fetch`**
  - Upgrading an application does not cause `BackgroundFetch` tasks to unregister. ([#8348](https://github.com/expo/expo/pull/8438) by [@mczernek](https://github.com/mczernek))
- **`expo-sqlite`**
  - Fixed support for using `expo-sqlite` on Web ([#8518](https://github.com/expo/expo/pull/8518) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-task-manager`**
  - Upgrading an application does not cause `BackgroundFetch` tasks to unregister. ([#8348](https://github.com/expo/expo/pull/8438) by [@mczernek](https://github.com/mczernek))

## 37.0.0

### 📚 3rd party library updates

- Updated `react-native-shared-element` from `0.5.1` to `0.5.6`. ([#7033](https://github.com/expo/expo/pull/7033) by [@IjzerenHein](https://github.com/IjzerenHein))
- Updated `@react-native-community/netinfo` from `4.6.0` to `5.5.0`. **Some deprecated methods have been removed in this version, make sure to check out [`NetInfo` docs](https://github.com/react-native-community/react-native-netinfo) for available API.** ([#7095](https://github.com/expo/expo/pull/7095) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/datetimepicker` from `2.1.0` to `2.2.2`. ([#7119](https://github.com/expo/expo/pull/7119) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-gesture-handler` from `1.5.1` to `1.6.0`. ([#7121](https://github.com/expo/expo/pull/7121) by [@tsapeta](https://github.com/tsapeta))
- Updated `@react-native-community/masked-view` from `0.1.5` to `0.1.6`.
- Updated `@react-native-community/viewpager` from `2.0.2` to `3.3.0`.
- Updated `react-native-reanimated` from `1.4.0` to `1.7.0`.
- Updated `react-native-svg` from `9.13.3` to `11.0.1`.
- Updated `react-native-view-shot` from `3.0.2` to `3.1.2`.
- Updated `react-native-webview` from `7.4.3` to `8.1.1`.
- Updated `react-native-appearance` from `0.2.1` to `0.3.3`. ([#7250](https://github.com/expo/expo/pull/7250) by [@tsapeta](https://github.com/tsapeta))
- Updated `react-native-safe-area-context` from `0.6.0` to `0.7.3`.
- Updated `react-native-screens` from `2.0.0-alpha.12` to `2.2.0` 🎉. ([#7183](https://github.com/expo/expo/pull/7183) by [@tsapeta](https://github.com/tsapeta), ([#7201](https://github.com/expo/expo/pull/7201) [@bbarthec](https://github.com/bbarthec)), ([#7215](https://github.com/expo/expo/pull/7215) [@LinusU](https://github.com/LinusU))

### 🛠 Breaking changes

- **Android push notifications:** your Google API key specified in `google-services.json` must allow access to the Cloud Messaging API if you have restricted your API key to access only specific APIs. In the Google Cloud console, browse to [APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials). Find the API key that is associated with your app and click the pencil icon to edit it. Under "API restrictions", if the key is restricted, add "Firebase Installations API" and "Cloud Messaging" to the set of allowed APIs and save the changes. (Technical note: Google changed the underlying Firebase Cloud Messaging library in `com.google.firebase:firebase-messaging:20.1.2` to depend on the Firebase Installations API, which applies API key restrictions. See Google's notes [here](https://firebase.google.com/support/release-notes/android#2020-02-27) and [here](https://github.com/firebase/firebase-android-sdk/blob/master/firebase-installations/API_KEY_RESTRICTIONS.md).)
- `expo-app-auth` Remove SSL features from unsafe connection builder. ([#7187](https://github.com/expo/expo/pull/7187) by [@evanbacon](https://github.com/evanbacon))
- `expo-constants` `Constants.deviceName` now only returns the possible Browser name and doesn't fallback to engine or OS name. ([#6809](https://github.com/expo/expo/pull/6809) [@evanbacon](https://github.com/evanbacon))
- `expo-constants` `Constants.platform.web` now only returns the `ua` (user agent string). ([#6809](https://github.com/expo/expo/pull/6809) [@evanbacon](https://github.com/evanbacon))
- `expo-crypto` Removed support for the MD2 and MD4 hashing algorithms in the Expo client and standalone apps. ([#6464](https://github.com/expo/expo/pull/6464) [@sjchmiela](https://github.com/sjchmiela))
- Enriched `androidStatusBar` configuration in `app.json`. ([#6506](https://github.com/expo/expo/pull/6506) [@bbarthec](https://github.com/bbarthec))
- Extended `androidNavigationBar.visible` configuration in `app.json`. To keep the same behavior as before, change your `androidNavigationBar.visible` field from `false` to `leanback`. ([#7049](https://github.com/expo/expo/pull/7049) [@cruzach](https://github.com/cruzach))
- **`expo`**: Removed `AuthSession` from the `expo` package and extracted into `expo-auth-session` unimodule. ([#6989](https://github.com/expo/expo/pull/6989) by [@lukmccall](https://github.com/lukmccall))
- **`expo`**: Removed `ScreenOrientation` from the `expo` package and extracted into `expo-screen-orientation` unimodule. ([#6760](https://github.com/expo/expo/pull/6760) by [@lukmccall](https://github.com/lukmccall))
- **`expo`**: Updated `Linking.makeUrl` to create URLs that follow the [URI specification](https://tools.ietf.org/html/rfc3986#section-3). Making a hostless URL will result in the format `myapp:///path/into/app` ([#6781](https://github.com/expo/expo/pull/6781) by [@cruzach](https://github.com/cruzach))
- Removed `Orientation.PORTRAIT` and `Orientation.LANDSCAPE` from `ScreenOrientation` in favor of their more specific versions. ([#6760](https://github.com/expo/expo/pull/6760) by [@lukmccall](https://github.com/lukmccall))
- `LocalAuthentication.authenticateAsync` will now display Android's UI component to prompt the user to authenticate. ([#6846](https://github.com/expo/expo/pull/6846) by [@LinusU](https://github.com/LinusU))
- `StatusBar` on Android has `dark-content` by default to match iOS. ([#7317](https://github.com/expo/expo/pull/7317) [@bbarthec](https://github.com/bbarthec))
- All native Facebook API calls made in the Expo Client app on iOS are made with the Expo Client's own Facebook App ID. ([#7931](https://github.com/expo/expo/pull/7931) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Fixed loading images for manipulation in `expo-image-loader`. ([#7417](https://github.com/expo/expo/pull/7417) by [@mczernek](https://github.com/mczernek))
- Added support for video mirroring with `expo-camera`. ([#7016](https://github.com/expo/expo/pull/7016) by [@scandinaro](https://github.com/scandinaro))
- Added support for badge numbers. ([#4562](https://github.com/expo/expo/pull/4562) by [@jaulz](https://github.com/jaulz))
- `expo-task-manager` supports bare workflow. ([#6828](https://github.com/expo/expo/pull/6828) by [@mczernek](https://github.com/mczernek))
- Add support for `expo-firebase-core`. ([#7013](https://github.com/expo/expo/pull/7013) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add support for `expo-firebase-analytics`. ([#7017](https://github.com/expo/expo/pull/7017) by [@evanbacon](https://github.com/evanbacon) and [@IjzerenHein](https://github.com/IjzerenHein))
- Add `MailComposer.isAvailableAsync` method. ([#6552](https://github.com/expo/expo/pull/6552) by [@evanbacon](https://github.com/EvanBacon))
- Add `showInRecents` option to the `AuthSessions.startAsync` determining whether a browsed website should be shown as a separate entry in Android recent/multitasking view. ([#6701](https://github.com/expo/expo/pull/6701) by [@esamelson](https://github.com/esamelson))
- Replaced `FingerprintManager` with `BiometricPrompt` from `AndroidX` in `LocalAuthentication`. ([#6846](https://github.com/expo/expo/pull/6846) by [@LinusU](https://github.com/LinusU))

### 🐛 Bug fixes

- Fixed parsing booleans in `SQLite` ([#7225](https://github.com/expo/expo/pull/7225) by [@mczernek](https://github.com/mczernek))
- Fixed value reported by `FileSystem.getFreeDiskStorageAsync` (was `2^53 - 1`, now is bytes available) ([#6465](https://github.com/expo/expo/pull/6465) by [@sjchmiela](https://github.com/sjchmiela))
- Added `setOnPlaybackStatusUpdate` to `Video.refs` ([#6213](https://github.com/expo/expo/pull/6213) by [@mczernek](https://github.com/mczernek))
- Updated underlying Facebook SDK on Android to v5.12.1 ([#6462](https://github.com/expo/expo/pull/6462) by [@sjchmiela](https://github.com/sjchmiela))
- Removed SpongyCastle (BouncyCastle repackaging) from among Android dependencies. ([#6464](https://github.com/expo/expo/pull/6464) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed fullscreen events on iOS for native controls. ([#6504](https://github.com/expo/expo/pull/6504) by [@mczernek](https://github.com/mczernek))
- Fixed `Camera.takePictureAsync()` not saving metadata on iOS. ([#6428](https://github.com/expo/expo/pull/6428) by [@lukmccall](https://github.com/lukmccall))
- Fixed `KeyboardAvoidingView` in standalone Android builds. ([#6506](https://github.com/expo/expo/pull/6506) [@bbarthec](https://github.com/bbarthec))
- Fixed a bug where `safariViewControllerDidFinish` is not called if you close the webview with the "Swipe to dismiss" gesture. ([#6581](https://github.com/expo/expo/pull/6581) by [@axeldelafosse](https://github.com/axeldelafosse))
- Fixed `FileSystem.downloadAsync()` throwing `NullPointerException` in rare failures on Android. ([#6819](https://github.com/expo/expo/pull/6819) by [@jsamr](https://github.com/jsamr/))
- `MediaLibrary.saveToLibraryAsync` and `MediaLibrary.createAssetAsync` will throw an error when provided path does not contain an extension. ([#7030](https://github.com/expo/expo/pull/7030) by [@lukmccall](https://github.com/lukmccall))
- Fixed `FileSystem.getTotalDiskCapacityAsync()` incorrectly returning `2^53 - 1` instead of the actual total disk capacity. ([#6978](https://github.com/expo/expo/pull/6978) by [@cruzach](https://github.com/cruzach/))
- Fixed `VideoThumbnails.getThumbnailAsync` crashing when the provided file is corrupted. ([#6877](https://github.com/expo/expo/pull/6877) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Linking.openSettings` is undefined. ([#7128](https://github.com/expo/expo/pull/7128) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Linking.sendIntent` is undefined. ([#7386](https://github.com/expo/expo/pull/7386) by [@brentvatne](https://github.com/brentvatne))
- Fixed `Camera.takePictureAsync` not resolving promise when native camera isn't ready on iOS. ([#7144](https://github.com/expo/expo/pull/7144) by [@bbarthec](https://github.com/bbarthec))
- Fixed [NPE crash in GeofencingTaskConsumer](https://github.com/expo/expo/issues/5191) when `mTask` is made null mid-execution. ([#7147](https://github.com/expo/expo/pull/7147) by [@briefjudofox](https://github.com/briefjudofox))
- Fixed `ImagePicker.launchCameraAsync` reloading the application on the OnePlus 7. ([#7162](https://github.com/expo/expo/pull/7162) by [@lukmccall](https://github.com/lukmccall))
- Fixed the bare React Native application not compiling with the `use_frameworks!` option. ([#6503](https://github.com/expo/expo/pull/6503) by [@lukmccall](https://github.com/lukmccall))
- Fixed `AppRegistry.setWrapperComponentProvider` in managed Expo apps. ([#6530](https://github.com/expo/expo/pull/6530) by [@serhiipalash](https://github.com/serhiipalash))
- Fixed `Facebook SDK` not being fully initialized. ([#6527](https://github.com/expo/expo/pull/6527) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed `Battery` import breaking on Web. ([#6545](https://github.com/expo/expo/pull/6545) by [@evanbacon](https://github.com/EvanBacon))
- Fixed the `RedBox` being covered by the notch on Android. ([#6644](https://github.com/expo/expo/pull/6644) by [@cruzach](https://github.com/cruzach))
- Fixed SSR support in `ErrorRecovery`. ([#6672](https://github.com/expo/expo/pull/6672) by [@evanbacon](https://github.com/EvanBacon))
- Fixed `Linking.makeUrl` and `Linking.parse` not matching. ([#6688](https://github.com/expo/expo/pull/6688) by [@cruzach](https://github.com/cruzach))
- Fixed `StoreReview.requestReview` throwing `NullPointerException` in the bare workflow. ([#6713](https://github.com/expo/expo/pull/6713) by [@cruzach](https://github.com/cruzach))
- Fixed NDK not installing when running `yarn setup:native`. ([#6685](https://github.com/expo/expo/pull/6685) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fixed `Linking` not decoding query parameters. ([#6774](https://github.com/expo/expo/pull/6774) by [@cruzach](https://github.com/cruzach))
- Fixed `Contacts` not saving the year correctly. ([#6744](https://github.com/expo/expo/pull/6744) by [@tasn](https://github.com/tasn))
- Fixed `Audio.setAudioModeAsync` parameter type. ([#6833](https://github.com/expo/expo/pull/6833) by [@mxhold](https://github.com/mxhold))
- Fixed `LocalAuthentication.authenticateAsync` resulting in the `user_cancel` error immediately on Android. ([#6962](https://github.com/expo/expo/pull/6962) by [@LinusU](https://github.com/LinusU))
- Fixed `Permissions.askAsync` crashing on devices with Android 21 and 22 in the bare workflow. ([#6736](https://github.com/expo/expo/pull/6736) by [@lukmccall](https://github.com/lukmccall))
- Fixed `HeadlessAppLoader` crashing after the activity is killed. ([#6879](https://github.com/expo/expo/pull/6879) by [@tasn](https://github.com/tasn))
- Fixed `fields` parameter type in `Contacts.getContactByIdAsync` method. ([#6910](https://github.com/expo/expo/pull/6910) by [AryanJ-NYC](https://github.com/AryanJ-NYC))
- Fixed `DocumentPicker.DocumentResult` type. ([#7064](https://github.com/expo/expo/pull/7064) by [@SimenB](https://github.com/SimenB))
- Fixed `Constants.installationId` being `null` in the bare workflow after ejecting. ([#6906](https://github.com/expo/expo/pull/6906) by [@cruzach](https://github.com/cruzach))
- Fixed `Facebook.logInWithReadPermissionsAsync` method throwing error (`undefined is not an object (evaluating '_ref.type')`). by ([#6527](https://github.com/expo/expo/pull/6527) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed some TypeScript types not being exported. ([#7120](https://github.com/expo/expo/pull/7120) by [@lukmccall](https://github.com/lukmccall))
- Fixed `TaskManager.defineTask` logging too many warnings and not working well with Fast Refresh. ([#7202](https://github.com/expo/expo/pull/7202) by [@tsapeta](https://github.com/tsapeta))
- Added doc comments to `TaskManager` and exported more types. ([#7202](https://github.com/expo/expo/pull/7202) by [@tsapeta](https://github.com/tsapeta))
- Fixed `Facebook.logInWithReadPermissionsAsync` redirecting to a blank white screen in the Expo Client app on iOS. ([#7931](https://github.com/expo/expo/pull/7931) by [@cruzach](https://github.com/cruzach))
- Fixed `Facebook.logInWithReadPermissionsAsync` resulting in the WebBrowser login modal remaining open after redirecting back to the app if selected "Sign in with Facebook app." ([#7931](https://github.com/expo/expo/pull/7931) by [@cruzach](https://github.com/cruzach))

## 36.0.0

### 📚 3rd party library updates

- `@react-native-community/netinfo` updated from `3.2.1` to `4.6.0`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-branch` updated from `3.1.1` to `4.2.1`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-gesture-handler` updated from `1.4.0` to `1.5.1`. ([#6127](https://github.com/expo/expo/pull/6127) by [@tsapeta](https://github.com/tsapeta) and [8b0e1b6](https://github.com/expo/expo/commit/8b0e1b6852bf631558d7b6b47d1db782c1c3d528) by [@esamelson](https://github.com/esamelson))
- `react-native-maps` updated from `0.25.0` to `0.26.1`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-reanimated` updated from `1.3.0` to `1.4.0`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-svg` updated from `9.9.5` to `9.13.3`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-view-shot` updated from `2.6.0` to `3.0.2`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-webview` updated from `7.0.5` to `7.4.3`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-safe-area-context` updated from `0.5.0` to `0.6.0`. ([#6176](https://github.com/expo/expo/pull/6176) by [@sjchmiela](https://github.com/sjchmiela))
- `react-native-screens` updated from `1.0.0-alpha.23` to `2.0.0-alpha.12`. ([#6258](https://github.com/expo/expo/pull/6258) by [@sjchmiela](https://github.com/sjchmiela) and [#6357](https://github.com/expo/expo/pull/6357) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- **`CameraRoll`**: Removed `CameraRoll` from `react-native` core, developers are encouraged to use [`expo-media-library`](https://docs.expo.io/versions/latest/sdk/media-library/) instead
- **`ART`**: Removed `ART` from `react-native` core, developers are encouraged to use [`react-native-svg`](https://github.com/react-native-community/react-native-svg) instead
- **`jest-expo`**: Removed `mockPlatformIOS()`, `mockPlatformAndroid()`, `mockPlatformWeb()`, `describeCrossPlatform()` in favor of platform specific presets like `jest-expo/universal`. ([#5645](https://github.com/expo/expo/pull/5645) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo`**: Removed Branch export from `expo/Branch`. ([#6190](https://github.com/expo/expo/pull/6190) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo`**: Removed `ErrorRecovery` from the `expo` package and extracted into `expo-error-recovery` unimodule. ([#5357](https://github.com/expo/expo/pull/5357) by [@lukmccall](https://github.com/lukmccall))
- **`expo`**: Updated `Linking.parse` to better handle non-expo URLs. URLs like `myapp://hello/world` are now parsed so that `hello` is the hostname and `world` is the path, according to the URI specification; [more info here](https://github.com/expo/expo/issues/6497#issuecomment-574882448). ([#5179](https://github.com/expo/expo/pull/5179) by [@koenpunt](https://github.com/koenpunt))
- **`expo-analytics-segment`**: Fixed `enabled` behavior inverted on iOS. ([#6242](https://github.com/expo/expo/pull/6242) by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-facebook`**: Disabled autoinitialization of the Facebook SDK and added an `initializeAsync` method and `autoinit` app.json setting. ([#5924] by [@sjchmiela](https://github.com/sjchmiela))
- **`expo-keep-awake`**: Removed deprecated methods and components. ([#6006](https://github.com/expo/expo/pull/6006) by [@EvanBacon](https://github.com/EvanBacon))
- **`expo-location`**: `Location.requestPermissionsAsync()` is no longer being rejected when permissions were not granted. Instead it returns `PermissionsResponse` object, which is similar to the result of `Permissions.askAsync(Permissions.Location)`. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- **`expo-store-review`**: Replace `StoreReview.isSupported` method with `StoreReview.isAvailableAsync` returning promise instead of boolean. ([#6195](https://github.com/expo/expo/pull/6195) by [@danibonilha](https://github.com/danibonilha))
- **`expo-calendar`**: Methods creating or updating calendar events now reject when passed `timeZone` is invalid. ([#6326](https://github.com/expo/expo/pull/6326) by [@lukmccall](https://github.com/lukmccall))
- **`expo-screen-orientation`**: Removed deprecated methods `allow`, `allowAsync`, and `doesSupportAsync`. ([#6007](https://github.com/expo/expo/pull/6007) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added `MediaLibrary.saveToAssetsAsync` function that can work without `CAMERA_ROLL` permission. ([#5678](https://github.com/expo/expo/pull/5678) by [@lukmccall](https://github.com/lukmccall))
- Added `setTrackingOptions` to `expo-analytics-amplitude` to fine-tune what Amplitude can track. ([#5877](https://github.com/expo/expo/pull/5877) by [@amaurymartiny](https://github.com/amaurymartiny))
- Added support for `Speech.getAvailableVoicesAsync()` on Android. ([#5887](f0a9d8ce87451dbce8c0a309ff917c8b26472861) by [@Mitch528](https://github.com/Mitch528))
- Added `@react-native-community/masked-view` in version `0.1.5`. ([#6193](https://github.com/expo/expo/pull/6193) by [@brentvatne](https://github.com/brentvatne))
- Added `@react-native-community/viewpager` in version `2.0.2`. ([#6198](https://github.com/expo/expo/pull/6198) by [@brentvatne](https://github.com/brentvatne))
- Added `@react-native-community/datetimepicker` in version `2.1.0`. ([#6087](https://github.com/expo/expo/pull/6087) by [@tsapeta](https://github.com/tsapeta))
- Added `canAskAgain` and `granted` fields to `PermissionsResponse`. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- Added support for `react-native-appearance` on Android and Web. ([#6162](https://github.com/expo/expo/pull/6162) by [@bbarthec](https://github.com/bbarthec))
- Added `Location.getLastKnownPositionAsync` to get the last known position of the device. ([#6246](https://github.com/expo/expo/pull/6246) by [@lukmccall](https://github.com/lukmccall))
- Added support for complex recurrence rules for events and reminders on iOS. ([#6300](https://github.com/expo/expo/pull/6300) by [@tasn](https://github.com/tasn))
- Added `exif` and `base64` properties into the TypeScript definitions for `ImagePickerResult` in `expo-image-picker`. ([#6311](https://github.com/expo/expo/pull/6311) by [@kyletsang](https://github.com/kyletsang))
- Added a `videoExportPreset` field to `ImagePickerOptions`, which sets dimensions and compression algorithm for exported video on iOS. ([#6046](https://github.com/expo/expo/pull/6046) by [@lukmccall](https://github.com/lukmccall))
- Added `nonce` option to `expo-apple-authentication`. ([#6404](https://github.com/expo/expo/pull/6404) by [@brentvatne](https://github.com/brentvatne))
- Added support for more permissions on web. ([#6115](https://github.com/expo/expo/pull/6115) by [@EvanBacon](https://github.com/EvanBacon))
- Added better `Camera` support across web browsers. ([#6207](https://github.com/expo/expo/pull/6207) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed `MediaPlayer` not working on some Android devices ([#6320](https://github.com/expo/expo/pull/6320) by [@mczernek](https://github.com/mczernek))
- Fixed `Audio.setAudioModeAsync` to auto-fill with previously set values (falls back to default values) if not all fields are provided. ([#5593](https://github.com/expo/expo/pull/5593) by [@cruzach](https://github.com/cruzach))
- Fixed crash when `BarCodeScanner` was mounted more than 128 times. ([#5719](https://github.com/expo/expo/pull/5719) by [@geovannimp](https://github.com/geovannimp))
- Fixed URI parsing in `expo-video-thumbnails`. ([#5711](https://github.com/expo/expo/pull/5711) by [@lukmccall](https://github.com/lukmccall))
- Fixed `MediaLibrary` methods crashing on Android 10. ([#5905](https://github.com/expo/expo/pull/5905) by [@lukmccall](https://github.com/lukmccall))
- Fixed `MediaLibrary.getMomentsAsync` crashing if `locationNames` array is null. ([#5937](https://github.com/expo/expo/pull/5937) by [@lukmccall](https://github.com/lukmccall))
- Fixed `MediaLibrary.getAlbumsAsync()` not getting albums in folders on iOS. ([#5857](https://github.com/expo/expo/pull/5857) by [@lukmccall](https://github.com/lukmccall))
- Fixed unclosed http connections in `FileSystem.downloadAsync` method. ([#5840](https://github.com/expo/expo/pull/5840) by [@bbarthec](https://github.com/bbarthec))
- Fixed `ImagePicker` ignoring orientation of the application. ([#5946](https://github.com/expo/expo/pull/5946) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Calendar.getCalendarsAsync` rejecting on iOS 13, when `source.name` is null. ([#5994](https://github.com/expo/expo/pull/5994) by [@lukmccall](https://github.com/lukmccall))
- Fixed handling URI with no scheme in `ExpoFileSystem`. ([#5904](https://github.com/expo/expo/pull/5904) by [@bbarthec](https://github.com/bbarthec))
- Fixed `FileSystem#deleteAsync` in older Android SDKs. ([#5923](https://github.com/expo/expo/pull/5923) by [@bbarthec](https://github.com/bbarthec))
- Fixed image cropping on Android in `expo-image-manipulator`. ([#5828](https://github.com/expo/expo/pull/5828) by [@matiasmelendi](https://github.com/matiasmelendi))
- Fixed type problem with `EXiOSOperatingSystemVersion` struct in `expo-gl-cpp`. ([#6063](https://github.com/expo/expo/pull/6063) by [@crubier](https://github.com/crubier))
- Fixed blinking `Camera.Constants.FlashMode.torch` on iOS in `Camera`. ([#6128](https://github.com/expo/expo/pull/6128) by [@bbarthec](https://github.com/bbarthec))
- Fixed race condition in `GoogleSignIn` on iOS. ([#5872](https://github.com/expo/expo/pull/5872) by [@vonovak](https://github.com/vonovak)])
- Fixed `Contacts.presentFormAsync` pre-filling, when `bool` value was provided. ([#5522](https://github.com/expo/expo/pull/5522) by [@lukmccall](https://github.com/lukmccall))
- Fixed crashes when the user tries to download a file through `react-native-webview` without granted storage permission on Android. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Permissions.getAsync` result, which was inconsistent with iOS settings. ([#5061](https://github.com/expo/expo/pull/5061) by [@lukmccall](https://github.com/lukmccall))
- Fixed scanning `PDF417` and `Code39` in `BarCodeScanner` on iOS. ([#5976](https://github.com/expo/expo/pull/5531) by [@bbarthec](https://github.com/bbarthec))
- Add missing `mute` property in `Camera.recordAsync` in the TypeScript definition. ([#6192](https://github.com/expo/expo/pull/6192) by [@wcandillon](https://github.com/wcandillon))
- Warn when `Linking.makeUrl` is called in Expo client and no scheme is present in `app.json` in order to prevent standalone builds from crashing due to missing scheme. ([#6277](https://github.com/expo/expo/pull/6277) by [@brentvatne](https://github.com/brentvatne))
- Fixed `keychainAccessible` option not having any effect on iOS (`SecureStore` module) ([#6291](https://github.com/expo/expo/pull/6291)) by [@sjchmiela](https://github.com/sjchmiela)
- Fixed presentation style of `WebBrowser` modal on iOS 13+ (it is now presented fullscreen instead of a modal). ([#6345](https://github.com/expo/expo/pull/6345)) by [@roothybrid7](https://github.com/roothybrid7)
- Fixed `expo-gl` crashing an app when context initialization happens on remote JS context. ([#6381](https://github.com/expo/expo/pull/6381) by [@tsapeta](https://github.com/tsapeta))
- Fixed memory leaks caused by `ImagePicker` module. ([#6303](https://github.com/expo/expo/pull/6303) by [@lukmccall](https://github.com/lukmccall))
- Fixed Android scoped `FileSystem` migration. ([#6367](https://github.com/expo/expo/pull/6367))
- Fixed `ScreenOrientation` crashing on Edge. ([#5913](https://github.com/expo/expo/pull/5913) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `LinearGradient` colors on web. ([#5843](https://github.com/expo/expo/pull/5843) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `MediaLibrary.getAssetInfoAsync()` not returning `localUri` for videos. ([#5806](https://github.com/expo/expo/pull/5806) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Localization` constants export in iOS simulator. ([#5740](https://github.com/expo/expo/pull/5740) by [@lukmccall](https://github.com/lukmccall))
- Removed unnecessary `CameraRoll` permissions check in `ImagePicker` on iOS 11+. ([#5822](https://github.com/expo/expo/pull/5822) by [@lukmccall](https://github.com/lukmccall))
- Fixed default value for `fallbackLabel` in `LocalAuthentication.authenticateAsync`. ([#5844](https://github.com/expo/expo/pull/5844) by [@cruzach](https://github.com/cruzach))
- Fixed getting `Contacts` containers without specifying a predicate. ([#6016](https://github.com/expo/expo/pull/6016) by [@tasn](https://github.com/tasn))
- Fixed vector icons in MS Edge by disabling font face observer. ([#5961](https://github.com/expo/expo/pull/5961) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed typings for `Calendar.getRemindersAsync()`. ([#6055](https://github.com/expo/expo/pull/6055) by [@tasn](https://github.com/tasn))
- Fixed `Camera` continuing to run after being unmounted on web. ([#6117](https://github.com/expo/expo/pull/6117) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed exceptions logged in the `AV` module on Android. ([#6099](https://github.com/expo/expo/pull/6099) by [@danmaas](https://github.com/danmaas))
- Fixed crash when calling `Amplitude.setUserProperties()` on Android. ([#6174](https://github.com/expo/expo/pull/6174) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed methods for scheduling Notifications. ([#5470](https://github.com/expo/expo/pull/5470) by [@Szymon20000](https://github.com/Szymon20000))
- Fixed unloading sounds in the `AV` module on web. ([#6214](https://github.com/expo/expo/pull/6214) by [@rickiesmooth](https://github.com/rickiesmooth))
- Add parital onFullscreenUpdate support to `AV` module on web. ([#6610](https://github.com/expo/expo/pull/6610) by [@awinograd](https://github.com/awinograd))

## 35.0.0

### 📚 3rd party library updates

- `react-native-maps` updated from `0.24.0` to `0.25.0`
- `react-native-reanimated` updated from `1.1.0` to `1.2.0`
- `react-native-screens` updated from `1.0.0-alpha.22` to `1.0.0-alpha.23`
- `react-native-svg` updated from `9.5.1` to `9.9.2`
- `react-native-webview` updated from `5.12.0` to `7.0.5`

### 🛠 Breaking changes

- `FileSystem.documentDirectory` is under a new directory. If upgrading from SDK 32 or below, you must upgrade your app to SDK 33 or 34 first, before upgrading to SDK 35 and above in order to migrate app files. ([#5381](https://github.com/expo/expo/pull/5381) by [@Szymon20000](https://github.com/Szymon20000))
- `Google.logInAsync()` now accepts a `redirectUrl` value for apps running in the Expo Client. Previously, it would ignore this, so if you are passing a value, make sure to [follow the guidelines](https://docs.expo.io/versions/latest/sdk/google/#loginasync). ([#4904](https://github.com/expo/expo/pull/4904) by [@cruzach](https://github.com/cruzach))
- Google Mobile Ads now require `expo.[platform].config.googleMobileAdsAppId` configuration value present in `app.json`. The value can be found by following the guide in [this Google Support answer](https://support.google.com/admob/answer/7356431). ([#5447](https://github.com/expo/expo/pull/5447) by [@sjchmiela](https://github.com/sjchmiela))
- Replace `Localization.country` constants with `Localization.region` and make it only available on iOS and Web ([#4921](https://github.com/expo/expo/pull/4921) by [@lukmccall](https://github.com/lukmccall))
- Upgraded `FBSDK*Kit` to `v5.4.1`. This upgrade removed support for all login behaviors other than `browser`. Possible motivations behind this change may be found [here](https://stackoverflow.com/a/32659545/1123156), [here](https://github.com/facebook/facebook-objc-sdk/commit/95e67c98f0b53adc8a8ea610fdfd0457be3d4d2b) and [here](https://github.com/facebook/facebook-objc-sdk/pull/964). `behavior` parameter has been removed from TS type declaration and will not have any effect anymore ([#5499](https://github.com/expo/expo/pull/5499) by [@sjchmiela](https://github.com/sjchmiela))
- Removed contact's `note` field from being requested if requested fields are not provided. ([#5601](https://github.com/expo/expo/pull/5601) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added `expo-network` unimodule that provides device's network information such as its IP address or airplane mode status. ([#5533](https://github.com/expo/expo/pull/5074) by [@ninjaachibi](https://github.com/ninjaachibi))
- Added `expo-cellular` unimodule that provides information about the user's cellular service provider. ([#5098](https://github.com/expo/expo/pull/5098) by [@vivianzzhu91](https://github.com/vivianzzhu91]))
- Added `expo-battery` unimodule providing informations about the physical device's battery. ([#4804](https://github.com/expo/expo/pull/4804) by [@ninjaachibi](https://github.com/ninjaachibi) and [@vivianzzhu91](https://github.com/vivianzzhu91]))
- Added `expo-apple-authentication` unimodule providing "Sign In with Apple" functionality. ([#5421](https://github.com/expo/expo/pull/5421) by [@matt-oakes](https://github.com/matt-oakes), [@vonovak](https://github.com/vonovak), [@bbarthec](https://github.com/bbarthec), [@esamelson](https://github.com/esamelson) and [@tsapeta](https://github.com/tsapeta))
- Added [`react-native-shared-element`](https://github.com/IjzerenHein/react-native-shared-element) to Expo client and standalone apps. ([#5533](https://github.com/expo/expo/pull/5533) by [@brentvatne](https://github.com/brentvatne))
- Added an option which allows displaying notifications in foreground on iOS. ([#4802](https://github.com/expo/expo/pull/4802) by [@hesyifei](https://github.com/hesyifei))
- Added `lazyImports` option in `babel-preset-expo` which allows lazy-initializing/inline-requiring packages. ([#4685](https://github.com/expo/expo/pull/4685) by [@hesyifei](https://github.com/hesyifei))
- Added the possibility to get MediaLibrary assets from specific time range. ([#5166](https://github.com/expo/expo/pull/5166) by [@tsapeta](https://github.com/tsapeta))
- Added Next.js supports with Expo for Web. ([#5275](https://github.com/expo/expo/pull/5275) by [@hesyifei](https://github.com/hesyifei))
- Added support for serving non-personalized Google AdMob Ads. ([#5323](https://github.com/expo/expo/pull/5323) by [@sjchmiela](https://github.com/sjchmiela))
- Added [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context) to Expo client and standalone apps. ([#5446](https://github.com/expo/expo/pull/5446) by [@sjchmiela](https://github.com/sjchmiela))
- Added supports for push notification in Expo for Web. ([#4963](https://github.com/expo/expo/pull/4963) by [@hesyifei](https://github.com/hesyifei))
- Added `Calendar.getDefaultCalendarAsync` method on iOS. ([#5485](https://github.com/expo/expo/pull/5485) by [@lukmccall](https://github.com/lukmccall))
- Added `react-native-appearance@0.0.8`.

### 🐛 Bug fixes

- Fixed MediaLibrary assets' width and height were sometimes equal to 0. ([#4935](https://github.com/expo/expo/pull/4935) by [@lukmccall](https://github.com/lukmccall))
- Fixed location background mode was required to use geofencing. ([#5198](https://github.com/expo/expo/pull/5198) by [@tsapeta](https://github.com/tsapeta))
- Fixed `Calendar.createEventAsync` crashing with relativeOffSet due to invalid type conversion from double to integer. ([#5134](https://github.com/expo/expo/pull/5134) by [@vivianzzhu91](https://github.com/vivianzzhu91))
- Fixed `AppAuthModule.createOAuthServiceConfiguration` typo resulting in crashes when `registrationEndpoint` is not specified in config.
- Fixed occasional `"ViewManagerAdapter_*" was not found in the UIManager` bugs. ([#5066](https://github.com/expo/expo/pull/5066) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed crashes when adding attachments with `MailComposer`. ([#5449](https://github.com/expo/expo/pull/5449) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed `ImagePicker.launchImageLibraryAsync` not working on iOS 13. ([#5434](https://github.com/expo/expo/pull/5434) by [@tsapeta](https://github.com/tsapeta))
- Fixed `ImageManipulator.manipulateAsync` not working with local paths. ([#5531](https://github.com/expo/expo/pull/5531) by [@bbarthec](https://github.com/bbarthec))
- Fixed `Camera#onBarCodeScanned` not firing when added at first rendering ([#5606](https://github.com/expo/expo/pull/5606) by [@bbarthec](https://github.com/bbarthec))
- Fixed background fetch calls throwing exceptions about mutating an array while being enumerated. ([#5612](https://github.com/expo/expo/pull/5612) by [@tsapeta](https://github.com/tsapeta))

## 34.0.0

### 📚 3rd party library updates

- `react-native-gesture-handler` updated from `1.2.1` to `1.3.0`
- `react-native-branch` updated from `2.2.5` to `3.1.1`
- `react-native-reanimated` updated from `1.0.1` to `1.1.0`
- `react-native-svg` updated from `9.4.0` to `9.5.1`
- `react-native-webview` updated from `5.8.0` to `5.12.0`
- `@react-native-community/netinfo` updated from `2.0.10` to `3.2.1`

### 🛠 Breaking changes

- Removed `promptMessageIOS` string argument from `LocalAuthentication.authenticateAsync` in favor of options object. ([#4631](https://github.com/expo/expo/pull/4631) by [@tsapeta](https://github.com/tsapeta))
- Removed `Calendar.DEFAULT` and replaced it with `null`. ([#4836](https://github.com/expo/expo/pull/4836) by [@lukmccall](https://github.com/lukmccall))

### 🎉 New features

- Added `fallbackLabel` option to `LocalAuthentication.authenticateAsync` on iOS which allows to customize a title of the fallback button when the system doesn't recognize the user and asks to authenticate via device passcode. ([#4612](https://github.com/expo/expo/pull/4612) by [@changLiuUNSW](https://github.com/changLiuUNSW))
- added `native` mode for Android SplashScreen on standalone apps by [@bbarthec](https://github.com/bbarthec) ([#4567](https://github.com/expo/expo/pull/4567))
- added support for video recording in `ImagePicker.launchCameraAsync`. ([#4903](https://github.com/expo/expo/pull/4903) by [@lukmccall](https://github.com/lukmccall))
- added support for `ph://` URLs to `expo-file-system` ([#5195](https://github.com/expo/expo/pull/5195) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- fixed `BarCodeScanner` blocking UI when defining custom `barCodeTypes` on iOS by [@sjchmiela](https://github.com/sjchmiela)
- fixed picking images over 2000px on Android by [@bbarthec](https://github.com/bbarthec) ([#4731](https://github.com/expo/expo/pull/4731))
- fixed `Calendar.getEventsAsync` crashing if `calendarId` is SQL keyword by [@lukmccall](https://github.com/lukmccall) ([#4836](https://github.com/expo/expo/pull/4836))
- fixed `BOOL` interpretation on 32-bit iOS devices by [@lukmccall](https://github.com/lukmccall) ([#4862](https://github.com/expo/expo/pull/4862))
- fixed AV rejecting to further load an asset once any loading error occured ([#5105](https://github.com/expo/expo/pull/5105)) by [@sjchmiela](https://github.com/sjchmiela))
- fixed AV resetting player whenever props changed ([#5106](https://github.com/expo/expo/pull/5106)) by [@sjchmiela](https://github.com/sjchmiela))
- fixed bar code scanning crash if the result couldn't be converted to string ([#5183](https://github.com/expo/expo/pull/5183)) by [@sjchmiela](https://github.com/sjchmiela))
- fixed camera crash in standalone apps ([#5194](https://github.com/expo/expo/pull/5194)) by [@sjchmiela](https://github.com/sjchmiela))

## 33.0.0

### 🛠 Breaking changes

- updated `react-native-gesture-handler` to `1.2.1` by [@mczernek](https://github.com/mczernek) ([#4159](https://github.com/expo/expo/pull/4159))
- updated `react-native-svg` to `9.4.0` by [@Szymon20000](https://github.com/Szymon20000) and [@mczernek](https://github.com/mczernek) ([#3860](https://github.com/expo/expo/pull/3860), [#4159](https://github.com/expo/expo/pull/4159))
- updated `@react-native-community/netinfo` to `2.0.10` by [@sjchmiela](https://github.com/sjchmiela) ([#4153](https://github.com/expo/expo/pull/4153))
- updated `react-native-reanimated` to `1.0.1` by [@dsokal](https://github.com/dsokal) ([#4023](https://github.com/expo/expo/pull/4023))
- removed deprecated `MediaView` and `TriggerView` from `expo-ads-facebook` by [@EvanBacon](https://github.com/EvanBacon) ([#3539](https://github.com/expo/expo/pull/3603)). You should use `AdMediaView` & `AdTriggerView` instead.
- deprecated `Expo.Util` by [@EvanBacon](https://github.com/EvanBacon) ([#3539](https://github.com/expo/expo/pull/3577)). You should use `Expo.Updates` & `Expo.Localization` instead.
- removed use of `expolib_v1.okhttp` in favor of regular `okhttp` dependency by [@Szymon20000](https://github.com/Szymon20000) ([#3539](https://github.com/expo/expo/pull/3539)) (an update to `MainApplication.getOkHttpBuilder` may be required when upgrading)
- corrected behavior of splash screen image based on `resizeMode` in Android standalone apps (`contain` and `cover` were handled contrary to what docs state) by [@bbarthec](https://github.com/bbarthec) ([#3029](https://github.com/expo/expo/pull/3029))
- `Speech.speak` changed option name from `voiceIOS` to `voice`. [@Szymon20000](https://github.com/Szymon20000) ([#3423](https://github.com/expo/expo/pull/3423))
- renamed `Haptic` to `Haptics` and deprecated `Haptics.{notification, impact, selection}` in favour of `Haptics.{notificationAsync, impactAsync, selectionAsync}` [@bbarthec](https://github.com/bbarthec) ([#3330](https://github.com/expo/expo/pull/3330))
- `ImageManipulator.manipulateAsync` is now accepting `ImageManipulator.FlipType.{Vertical, Horizontal}` as flipping action parameter and `ImageManipulator.SaveFormat.{JPEG, PNG}` as saving option [@bbarthec](https://github.com/bbarthec) ([#3245](https://github.com/expo/expo/pull/3245))
- removed `devKernel` and `prodKernel` build flavors from Android ExpoKit projects (all Gradle commands become simply `[verb](Debug|Release)`, e.g. `installDebug` or `assembleRelease`) by [@esamelson](https://github.com/esamelson) ([#3386](https://github.com/expo/expo/pull/3386))
- renamed `IntentLauncherAndroid` to `IntentLauncher` and changed signature of `startActivityAsync` method by [@tsapeta](https://github.com/tsapeta) ([#3427](https://github.com/expo/expo/pull/3427))
- fixed crash in `WebBrowser.openBrowserAsync` when there is no browser supporting `customtabs` on Android by [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- `WebBrowser.openBrowserAsync` on Android resolves promise on opening Custom Tabs instead of on closing by [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- `WebBrowser.dismissBrowser` throws `UnavailabilityError` [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- added `staysActiveInBackground` audio mode option that selects whether audio playback or recording should continue when the app is in background by [@sjchmiela](https://github.com/sjchmiela) and [@redpandatronicsuk](https://github.com/redpandatronicsuk) ([#3498](https://github.com/expo/expo/pull/3498))
- renamed the `EncodingTypes` attribute to `EncodingType` in the FileSystem module docs to match changes in the source code by [@sergeichestakov](https://github.com/sergeichestakov) ([#3997](https://github.com/expo/expo/pull/3997))
- added a warning printed when attempting to store a value longer than 2048 bytes in the `SecureStore`. (Since SDK35 it will throw an error.) [@dsokal](https://github.com/dsokal) ([#4084](https://github.com/expo/expo/pull/4084))
- added `UMAppDelegateWrapper` which allows easy integration between unimodules and `AppDelegate` callbacks by [@Szymon20000](https://github.com/Szymon20000) ([#3917](https://github.com/expo/expo/pull/3917))
- changed `Constants.platform.ios.buildNumber` and `Constants.platform.android.versionCode` to `null` when running an app in Expo Client by [@dsokal](https://github.com/dsokal) ([#4203](https://github.com/expo/expo/pull/4203))
- upgraded `react-native-maps` to `0.24.2` by [@sjchmiela](https://github.com/sjchmiela) ([#3389](https://github.com/expo/expo/pull/3389), [#4158](https://github.com/expo/expo/pull/4158), ejected projects will need to add `HAVE_GOOGLE_MAPS=1` preprocessor definition to `Podfile`)
- removed option `sortBy.id` in `expo-media-library` by [@jkhales](https://github.com/jkhales) ([#4221](https://github.com/expo/expo/pull/4221))

### 🎉 New features

- updated `react-native-view-shot` to `2.6.0` by [@sjchmiela](https://github.com/sjchmiela) ([#4175](https://github.com/expo/expo/pull/4175))
- added `VideoThumbnails` API allowing you to thumbnail videos by [@graszka22](https://github.com/graszka22) ([#3980](https://github.com/expo/expo/pull/3980))
- upgraded `react-native-lottie` to `2.6.1` by [@sjchmiela](https://github.com/sjchmiela) ([#4147](https://github.com/expo/expo/pull/4147))
- `BarCodeScanner` is now returning barcode's bounding box [@Szymon20000](https://github.com/Szymon20000) ([#2904](https://github.com/expo/expo/pull/2904))
- added method `Speech.getAvailableVoicesAsync()` [@Szymon20000](https://github.com/Szymon20000) ([#3423](https://github.com/expo/expo/pull/3423))
- added `BackgroundFetch` support for Android by [@tsapeta](https://github.com/tsapeta) ([#3281](https://github.com/expo/expo/pull/3281))
- incorporated `react-native-webview@5.4.6` into Expo SDK by [@sjchmiela](https://github.com/sjchmiela) ([#3748](https://github.com/expo/expo/pull/3748))
- added support for overriding MIME type in `IntentLauncherAndroid.startActivityAsync` for Android by [@rhunt4675](https://github.com/rhunt4675) ([#3300](https://github.com/expo/expo/pull/3300))
- added `Location.enableNetworkProviderAsync` method to ask the user to turn on high accuracy location services by [@tsapeta](https://github.com/tsapeta) ([#3273](https://github.com/expo/expo/pull/3273))
- upgraded Facebook Audience Network SDK dependency to 5.1.1 (iOS) by [@sjchmiela](https://github.com/sjchmiela) ([#3394](https://github.com/expo/expo/pull/3394))
- upgraded Facebook Core- and LoginKit dependency to 4.40.0 by [@sjchmiela](https://github.com/sjchmiela) ([#3394](https://github.com/expo/expo/pull/3394))
- upgraded Facebook SDK dependency to 5.0.1 (Android) by [@sjchmiela](https://github.com/sjchmiela)
- upgraded `react-native-webview` to `5.8.1` by [@sjchmiela](https://github.com/sjchmiela) ([#4146](https://github.com/expo/expo/pull/4146))
- added Firebase integration to `expo-analytics-segment` by [@sjchmiela](https://github.com/sjchmiela) ([#3615](https://github.com/expo/expo/pull/3615))
- added support for new arguments in `WebBrowser.openBrowserAsync` as described in [the documentation](https://docs.expo.io/versions/latest/sdk/webbrowser/) by [@mczernek](https://github.com/mczernek) ([#3691](https://github.com/expo/expo/pull/3691))
- added tags support in `KeepAwake.activate` and `KeepAwake.deactivate` by [@mczernek](https://github.com/mczernek) [#3747](https://github.com/expo/expo/pull/3747)
- added `deferredUpdatesInterval` and `deferredUpdatesDistance` options that defer background location updates by [@tsapeta](https://github.com/tsapeta) ([#3548](https://github.com/expo/expo/pull/3548))
- added `foregroundService` option to background location (Android Oreo and newer) by [@tsapeta](https://github.com/tsapeta) ([#3837](https://github.com/expo/expo/pull/3837))
- added support for picking animated GIFs with `ImagePicker` by [@sjchmiela](https://github.com/sjchmiela) ([#3844](https://github.com/expo/expo/pull/3844))
- added support for headers in `downloadAsync` method in `FileSystem` by [@mczernek](https://github.com/mczernek) ([#3911](https://github.com/expo/expo/pull/3911))
- added support for custom poster styles in `Video` by [@sjchmiela](https://github.com/sjchmiela) ([#4165](https://github.com/expo/expo/issues/4165))
- added `pausesUpdatesAutomatically` option to automatically pause background location updates based on the `activityType` by [@tsapeta](https://github.com/tsapeta) ([#4167](https://github.com/expo/expo/pull/4167))
- added ability to load fonts by remote URI by [@seekshiva](https://github.com/seekshiva) ([#2745](https://github.com/expo/expo/pull/2745))
- added support for 64 bit platforms by [@wkozyra95](https://github.com/wkozyra95) ([#4565](https://github.com/expo/expo/pull/4565))

### 🐛 Bug fixes

- fixed several windows compatibility issues with `expo-yarn-workspaces` by [@nattyrice](https://github.com/nattyrice)
- fixed several issues related to `expo-av` by [@Szymon20000](https://github.com/Szymon20000) ([#3539](https://github.com/expo/expo/pull/3539))
- `Location.getCurrentPositionAsync` and `Location.watchPositionAsync` are now automatically asking for high accuracy location services by [@tsapeta](https://github.com/tsapeta) ([#3273](https://github.com/expo/expo/pull/3273))
- fix `Location.getCurrentPositionAsync` hanging on simultaneous calls by [@tsapeta](https://github.com/tsapeta) ([#3273](https://github.com/expo/expo/pull/3273))
- fix `ImagePicker.launchImageLibraryAsync` and `ImageManipulator.manipulateAsync` in SDKs lower than 32 [@bbarthec](https://github.com/bbarthec) ([#3159](https://github.com/expo/expo/pull/3159))
- fix app crash when attempting to `console.log(Object.create(null))` by [@juangl](https://github.com/juangl) ([#3143](https://github.com/expo/expo/pull/3143))
- `GoogleSignInOptions.offlineAccess` is now corrected `GoogleSignInOptions.isOfflineEnabled`
- fix `SMS.sendSMSAsync` crash on android for empty addresses list. Promise won't be rejected when there is no TELEPHONY feature on Android device, only when there is no SMS app by [@mczernek](https://github.com/mczernek) ([#3656](https://github.com/expo/expo/pull/3656))
- fix MediaPlayer not working on Android. by [@mczernek](https://github.com/mczernek) ([#3768](https://github.com/expo/expo/pull/3768))
- fix big `OkHttpClient` memory usage on Android (reuse instances) by [@sjchmiela](https://github.com/sjchmiela) ([#4264](https://github.com/expo/expo/pull/4264))
- fixed `Localization.isRTL` always being `true` on iOS by [@sjchmiela](https://github.com/sjchmiela) ([#3792](https://github.com/expo/expo/pull/3792))
- fixed adding/removing react children to `Camera` preview on Android by [@bbarthec](https://github.com/bbarthec) ([#3904](https://github.com/expo/expo/pull/3904))
- changed `FileSystem` requests timeout for downloading resumables from 10 seconds to 60 seconds on Android (now the timeout is 60s on both platforms) by [@Szymon20000](https://github.com/Szymon20000) ([#3872](https://github.com/expo/expo/pull/3872))
- removed unwanted downsampling of big images when using `ImageManipulator` on Android by [@bbarthec](https://github.com/bbarthec) ([#3928](https://github.com/expo/expo/pull/3928))
- fixed tablet splash always being shown in Expo Client if specified by [@GfxKai](https://github.com/GfxKai) ([#3538](https://github.com/expo/expo/pull/3538))
- the `properties` parameter of `Segment.screenWithProperties` is now a `{ [key: string]: any }`, instead of a `string` by [@juampi92](https://github.com/juampi92) ([#4053](https://github.com/expo/expo/pull/4053))
- allow manipulating `http://` and `https://` files using `ImageManipulator` on iOS by [@bbarthec](https://github.com/bbarthec) ([#3982](https://github.com/expo/expo/pull/3982))
- providing `onPlaybackStatusUpdate` property to `Video` doesn't show a warning anymore by [@sjchmiela](https://github.com/sjchmiela) ([#4130](https://github.com/expo/expo/pull/4130))
- calling `FileSystem.downloadAsync` will now raise an error when a target local directory doesn't exist by [@dsokal](https://github.com/dsokal) ([#4142](https://github.com/expo/expo/pull/4142))
- flush UI blocks when needed, which fixes eg. `Camera.takePicture` not resolving on iOS by [@sjchmiela](https://github.com/sjchmiela) ([#4125](https://github.com/expo/expo/pull/4125))
- fixed `MediaLibrary.createAssetAsync` crashing when supplying local asset URIs without `file://` protocol by [@tsapeta](https://github.com/tsapeta) ([#4189](https://github.com/expo/expo/pull/4189))
- fixed `EXC_BAD_ACCESS` crashes on startup on iOS below 12.0 by [@tsapeta](https://github.com/tsapeta) ([#4227](https://github.com/expo/expo/pull/4227))
- fix `jest-expo` Jest executable not starting Node on Windows by [@Artorp](https://github.com/Artorp) ([#3477](https://github.com/expo/expo/pull/3477))
- fixed crashes in `TaskManager` due to jobs queue being full by [@tsapeta](https://github.com/tsapeta) ([#4247](https://github.com/expo/expo/pull/4247))
- allow console.log() function to log truncated large files instead of reporting a PayloadTooLargeError. [@vivianzzhu91](https://github.com/vivianzzhu91) ([#4419](https://github.com/expo/expo/pull/4419))
- fixed sorting in `MediaLibrary.getAssetsAsync` by [@ninjaachibi](https://github.com/ninjaachibi) ([#4420](https://github.com/expo/expo/pull/4420))

## 32.0.0

### 🛠 Breaking changes

- deprecated `import { Font } from 'expo-font'` in favor of individually named exports (`import * as Font from expo-font`) for better dead-export elimination potential. Upgrade `@expo/vector-icons` if you get a warning about this. By [@ide](https://github.com/ide) ([`264c17cd`](https://github.com/expo/expo/commit/264c17cdb175021c7fd16bb461652b8ab6cb2fda))
- removed deprecated internal Expo modules (`Crypto`, `Fabric`, and `ImageCropper`), which were never part of the Expo API by [@ide](https://github.com/ide) ([#2880](https://github.com/expo/expo/pull/2880))
- removed deprecated `Expo.Fingerprint` API, which has been renamed to `Expo.LocalAuthentication` to reflect other forms of authentication (ex: FaceID) by [@ide](https://github.com/ide) ([`24e94d5`](https://github.com/expo/expo/commit/24e94d5c3c268793ec751ef07dbd31a2e41e6a8c))
- removed deprecated default export from the `expo` package. Instead of `import Expo from 'expo'`, write `import { A, B, C } from 'expo'` or `import * as Expo from 'expo'`. By [@ide](https://github.com/ide) ([#2865](https://github.com/expo/expo/pull/2865))
- removed deprecated support for passing an array into `Font.loadAsync`. This feature displayed a deprecation warning for several SDK versions so if you didn't see it, this change shouldn't affect you.
- deprecated `enableHighAccuracy` option in `Location` module in favor of `accuracy` which gives much more options by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- removed support for deprecated `onBarCodeRead` prop on `Camera` component by [@Szymon20000](https://github.com/Szymon20000) ([#2820](https://github.com/expo/expo/pull/2820)) (use `onBarCodeScanned` property)
- updated underlying Stripe dependency to 8.1.0 on Android and 13.2.0 on iOS and updated `expo-payments-stripe` with latest updates to `tipsi-stripe` (up to 6.1.2) by [@sjchmiela](https://github.com/sjchmiela) ([#2766](https://github.com/expo/expo/pull/2766)). This change dropped support for Bitcoin payments in SDK31.
- removed `READ_SMS` use of permission on Android, `SMS.sendSMSAsync` will now always resolve with `{ result: 'unknown' }` by [@esamelson](https://github.com/esamelson) ([#2982](https://github.com/expo/expo/pull/2982))
- upgraded Android build tools — Gradle to 4.10.2, Gradle plugin to 3.2.1 by [@sjchmiela](https://github.com/sjchmiela) ([`7292c27`](https://github.com/expo/expo/commit/7292c27), [`d0c8b8d`](https://github.com/expo/expo/commit/d0c8b8d))
- removed `run.sh` script from `android` directory in favor of `fastlane android start` command by [@nicknovitski](https://github.com/nicknovitski) ([`9301e95`](https://github.com/expo/expo/commit/9301e95533d4ed81a42955f64addb5001a32a236))
- removed `minSdk` application flavor from Android project (all Gradle commands in format `[verb][minSdkFlavor]minSdk[remoteKernelFlavor]Kernel[buildType]`, eg. `assembleDevMinSdkDevKernelDebug` become `[verb][remoteKernelFlavor]Kernel[buildType]`, eg. `assembleDevKernelDebug`) by [@sjchmiela](https://github.com/sjchmiela) ([`3b5e158`](https://github.com/expo/expo/commit/3b5e1583ecc210ee36b9d5772d2d7c35a6315500))
- calling `Haptic` methods on Android will now raise an error instead of a warning by [@EvanBacon](https://github.com/EvanBacon) ([#2787](https://github.com/expo/expo/pull/2787))

### 🎉 New features

- added locales on Android (`[ar, cs, de, es-rGT, fr, he, jt, ja, ko, nb, nl, pl, pt-rBR, ru-rRU, vi, zh, zh-rCN, zh-rTW]`) in `ImagePicker.{launchImageLibraryAsync, launchCameraAsync}` when using `{ allowsEditing: true }` option by [@bbarthec](https://github.com/bbarthec) ([#2955](https://github.com/expo/expo/pull/2955))
- added support for passing refs created by `React.createRef` to `takeSnapshotAsync` by [@sjchmiela](https://github.com/sjchmiela) ([#2771](https://github.com/expo/expo/pull/2771))
- upgraded Gradle plugin (to 3.2.1) and its wrapper (to 4.10.2) by [@sjchmiela](https://github.com/sjchmiela) ([#2716](https://github.com/expo/expo/pull/2716))
- added new `TaskManager` module that paves the way to background code execution by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- added API for background location updates by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- added geofencing to `Location` module by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- added new `BackgroundFetch` module (iOS only) by [@tsapeta](https://github.com/tsapeta) ([#2338](https://github.com/expo/expo/pull/2338))
- allowed Expo Jest preset to use TypeScript files by [@dalcib](https://github.com/dalcib) ([#2810](https://github.com/expo/expo/pull/2810))
- allowed selecting voice used by `Speech` on iOS by [@pyankoff](https://github.com/pyankoff) ([#2833](https://github.com/expo/expo/pull/2833))
- removed obsolete assets from standalone apps by [@sjchmiela](https://github.com/sjchmiela) ([#2850](https://github.com/expo/expo/pull/2850))
- added support for notifications categories by [@Szymon20000](https://github.com/Szymon20000) and [@sjchmiela](https://github.com/sjchmiela) ([#2316](https://github.com/expo/expo/pull/2316), [#2557](https://github.com/expo/expo/pull/2557))
- upgraded libraries: `react-native-gesture-handler` to `1.0.12`, `react-native-screens` to `1.0.0-alpha.22`, `react-native-reanimated` to `1.0.0-alpha.11` by [@tsapeta](https://github.com/tsapeta) and [@sjchmiela](https://github.com/sjchmiela) ([#2977](https://github.com/expo/expo/pull/2977), [#3078](https://github.com/expo/expo/pull/3078), [#3172](https://github.com/expo/expo/pull/3172), [#3232](https://github.com/expo/expo/pull/3232))

### 🐛 Bug fixes

- fixed problem with rerendering SVG (updated `react-native-svg` to `8.0.10`) by [@Szymon20000](https://github.com/Szymon20000) ([#3019](https://github.com/expo/expo/pull/3019))
- fixed wrong type casting in SQLite result [@Szymon20000](https://github.com/Szymon20000) ([#3005](https://github.com/expo/expo/pull/3005))
- fixed sending multiple consecutive SMS messages on iOS [@bbarthec](https://github.com/bbarthec) ([#2939](https://github.com/expo/expo/pull/2939))
- fixed GLView initialization with texture of size 0 on Android by [@bbarthec](https://github.com/bbarthec) ([#2907](https://github.com/expo/expo/pull/2907))
- fixed app cache size blowing up when using `ImagePicker` by [@sjchmiela](https://github.com/sjchmiela) ([#2750](https://github.com/expo/expo/pull/2750))
- fixed compression in ImagePicker by [@Szymon20000](https://github.com/Szymon20000) ([#2746](https://github.com/expo/expo/pull/2746))
- fixed `FileSystem` forbidding access to external directories by [@Szymon20000](https://github.com/Szymon20000) ([#2748](https://github.com/expo/expo/pull/2748), [#2808](https://github.com/expo/expo/pull/2808))
- upgraded Facebook SDK dependency to 4.39 by [@Szymon20000](https://github.com/Szymon20000) and [@sjchmiela](https://github.com/sjchmiela) ([#2710](https://github.com/expo/expo/pull/2710), [#3243](https://github.com/expo/expo/pull/3243))
- fixed object not beign decycled when sending logs to remote console by [@sjchmiela](https://github.com/sjchmiela) ([#2598](https://github.com/expo/expo/pull/2598))
- unified linear gradient behavior across platforms by [@sjchmiela](https://github.com/sjchmiela) ([#2624](https://github.com/expo/expo/pull/2624))
- fixed device orientation not being used when recording videos by [@flippinjoe](https://github.com/flippinjoe) ([expo-camera#2](https://github.com/expo/expo-camera/pull/2))
- fixed handling `quality` option passed to `Camera.takePictureAsync` on Android properly by [@Szymon20000](https://github.com/Szymon20000) ([#2692](https://github.com/expo/expo/pull/2692))
- fixed resumable downloads on iOS by base64-encoding `resumeData` by [@Szymon20000](https://github.com/Szymon20000) ([#2698](https://github.com/expo/expo/pull/2698))
- fixed `Permissions.LOCATION` issue that wouldn't allow asking for it in a multi-permission call by [@sjchmiela](https://github.com/sjchmiela) ([304fe560](https://github.com/expo/expo/commit/304fe560500b662be53be2c1d5a06445ad9d3702))
- fixed `onActivityResult` not being called on listeners registered to `ReactContext` by [@sjchmiela](https://github.com/sjchmiela) ([#2768](https://github.com/expo/expo/pull/2768))
- fixed fatal exception being thrown sometimes on Android when detecting barcodes by [@sjchmiela](https://github.com/sjchmiela) ([#2772](https://github.com/expo/expo/pull/2772))
- fixed `GLView.takeSnapshotAsync` crashing on Android if `framebuffer` option is specified by [@tsapeta](https://github.com/tsapeta) ([#2888](https://github.com/expo/expo/pull/2888))
- fixed `onPlaybackStatusUpdate` not being called with `didJustFinish: true` when playing with looping enabled on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2923](https://github.com/expo/expo/pull/2923))
- fixed bundle building/downloading progress indicator not showing in ejected apps by [@sjchmiela](https://github.com/sjchmiela) ([#2951](https://github.com/expo/expo/pull/2951), [#2954](https://github.com/expo/expo/pull/2954))
- fixed `subscription.remove()` not calling native `stopObserving()` for universal modules by [@ide](https://github.com/ide) ([#2897](https://github.com/expo/expo/pull/2897))
- fixed calendar ID being returned as integer instead of a string on Android (when calling eg. `Calendar.createCalendarAsync`) by [@Szymon20000](https://github.com/Szymon20000) ([#3004](https://github.com/expo/expo/pull/3004))
- fixed wrong fling direction for inverted `ScrollView`s on Android by [@mandrigin](https://github.com/mandrigin) (pulled in from React Native [facebook/react-native@b971c5b](https://github.com/facebook/react-native/commit/b971c5beb8c7f90543ea037194790142f4f57c80))
- fixed snapping Android `ScrollView`s with `pagingEnabled` by [@olegbl](https://github.com/olegbl) (pulled in from React Native [facebook/react-native@0869e54](https://github.com/facebook/react-native/commit/0869e546fe1448f6c56b4ae97e41e8a67278d7dd))
- fixed `Contacts` failing to add and remove contacts on Android by [@tsapeta](https://github.com/tsapeta) ([#3017](https://github.com/expo/expo/pull/3017))
- fixed `Permissions.CONTACTS` not asking for Android's `WRITE_CONTACTS` permission by [@tsapeta](https://github.com/tsapeta) ([#3017](https://github.com/expo/expo/pull/3017))

## 31.0.6

- fixed `expo-cli` wrapper failing on Windows by [@fson](https://github.com/fson) ([#2853](https://github.com/expo/expo/pull/2853))

## 31.0.5

- updated `react-native-maps` JS dependency to `0.22.1` by [@sjchmiela](https://github.com/sjchmiela) ([`ebb536c`](https://github.com/expo/expo/commit/ebb536c82f2b64fd6c71f37d589a028cf04b85c8))

## 31.0.4

- upgraded `react-native-gesture-handler` JS dependency to `1.0.9` by [@brentvatne](https://github.com/brentvatne) ([`ebb5cec`](https://github.com/expo/expo/commit/ebb5cecf3f74da1bd7868f66b9c0ba8717a70cf1))

## 31.0.3

- fix filtering out warnings about `require` cycles in `node_modules` by [@serhiipalash](https://github.com/serhiipalash) ([`aaf72bf`](https://github.com/expo/expo/commit/aaf72bf42e197e5cc300a3f722103ad5cedc3a90))
- fix `resizeMode` prop of `Video` component by [@ide](https://github.com/ide) ([`886b67d`](https://github.com/expo/expo/commit/886b67d0967c0f3d55a561fe7766e3df414c80bf))

## 31.0.2

- pass `undefined` through for `startPoint` and `endPoint` rather than `null` in `LinearGradient` by [@brentvatne](https://github.com/brentvatne) ([`643969`](https://github.com/expo/expo/commit/6439691431dbb9b443bb69d788129cf3ff25ae3b))
- remove require cycle in AV by [@ide](https://github.com/ide) ([`18d54da`](https://github.com/expo/expo/commit/18d54daad814ae7e8e6e359daf274f80ece8352d))

## 31.0.1

- filter out warnings about `require` cycles in `node_modules` by [@ide](https://github.com/ide) ([`68d130d`](https://github.com/expo/expo/commit/68d130d4b0e58c8faa050bfe7bd7c56ffa05e2ef))

## 31.0.0 (Partial Changelog)

### 🛠 Breaking changes

- The default export from the expo package is deprecated in favor of named exports to pave the way for static analysis tools by [@ide](https://github.com/ide) ([#2387](https://github.com/expo/expo/pull/2387))
- remove default `user_friends` permission when authenticating with `Facebook` module by [@EvanBacon](https://github.com/EvanBacon) ([`2ad86fad`](https://github.com/expo/expo/commit/2ad86fada7aacfa8fa0d50910e6d0c6130ca4840))
- dropped iOS 9 support by [@Szymon20000](https://github.com/Szymon20000) ([#2324](https://github.com/expo/expo/pull/2324))
- upgrade `react-native-svg` to `8.0.8` by [@sjchmiela](https://github.com/sjchmiela) and [@esamelson](https://github.com/esamelson) ([#2492](https://github.com/expo/expo/pull/2492))
- upgrade React Native to `v0.57.1` by [@ide](https://github.com/ide) (series of commits, eg. [`250589`](https://github.com/expo/expo/commit/250589c452902e27f6981c79a72390c4bf6c9b31))
- change `translation` field to `adTranslation` in an ad object returned by `FacebookAds.NativeAdView` by [@ide](https://github.com/ide) ([`ece59aa`](https://github.com/expo/expo/commit/ece59aa35daf769073373141c248239c967ccafd))
- refreshed, bug-free `Localization` API by [@EvanBacon](https://github.com/EvanBacon) ([#2327](https://github.com/expo/expo/pull/2327))
- drop Android 4.4 support by [@bbarthec](https://github.com/bbarthec) ([#2367](https://github.com/expo/expo/pull/2367))
- upgrade underyling Facebook SDK native dependencies to `4.37.0` by [@sjchmiela](https://github.com/sjchmiela) ([#2508](https://github.com/expo/expo/pull/2508))
- upgrade `react-native-view-shot` to `2.5.0` by [@sjchmiela](https://github.com/sjchmiela) ([#2518](https://github.com/expo/expo/pull/2518))
- upgrade `react-native-maps` to `0.22.1` by [@tsapeta](https://github.com/tsapeta) and [@sjchmiela](https://github.com/sjchmiela) ([#2496](https://github.com/expo/expo/pull/2496), [#2680](https://github.com/expo/expo/pull/2680))
- `FacebookAds.TriggerableView` is now `FacebookAds.AdTriggerView`
- `FacebookAds.MediaView` is now `FacebookAds.AdMediaView`
- The Speech API’s "onError" function is passed an `Error` instead of a string
- Flow types have been removed as we begin to migrate to TypeScript over the next few SDK releases
- Several Haptic enum types have been renamed: NotificationTypes → NotificationFeedbackType, ImpactStyles → ImpactFeedbackStyle
- Several AR enum types have been renamed: BlendShapes → BlendShape, FaceAnchorProps → FaceAnchorProp, PlaneDetectionTypes → PlaneDetection, WorldAlignmentTypes → WorldAlignment, EventTypes → EventType, AnchorTypes → AnchorType, AnchorEventTypes → AnchorEventType, FrameAttributes → FrameAttribute, TrackingStates → TrackingState, TrackingStateReasons → TrackingStateReason, TrackingConfigurations → TrackingConfiguration
- `Audio.Sound.create` has been renamed to `createAsync`
- Upgrade Babel to `7.0.0` by [@ide](https://github.com/ide) ([#2373](https://github.com/expo/expo/pull/2373))

### 🎉 New features

- return permitted/declined permissions arrays when authenticating with `Facebook` module by [@EvanBacon](https://github.com/EvanBacon) ([`2ad86fad`](https://github.com/expo/expo/commit/2ad86fada7aacfa8fa0d50910e6d0c6130ca4840))
- Base64 encoding support for `FileSystem` by [@EvanBacon](https://github.com/EvanBacon) ([#2328](https://github.com/expo/expo/pull/2328))
- video stabilization support in `Camera` by [@n8](https://github.com/n8) ([#2241](https://github.com/expo/expo/pull/2241))
- add support for asking for an authorization to always access location data by [@sjchmiela](https://github.com/sjchmiela) ([#2343](https://github.com/expo/expo/pull/2343))
- upgrade `react-native-gesture-handler` to `1.0.8`, `react-native-reanimated` to `1.0.0-alpha.10`, `react-native-screens` to `1.0.0-alpha.15` by [@brentvatne](https://github.com/brentvatne) ([`eb2a463`](https://github.com/expo/expo/commit/eb2a463304aefc798bd8fab29e9c89507e0710af), [`9bf1754`](https://github.com/expo/expo/commit/9bf17547f857865ffa01f4bacd7fc0b18e4f7ffa))
- add `Segment.{get,set}EnabledAsync` feature by [@sjchmiela](https://github.com/sjchmiela) ([#2412](https://github.com/expo/expo/pull/2412))
- add an Android-only `timeout` option to `Location.getCurrentPositionAsync` by [@bbarthec](https://github.com/bbarthec) ([#2369](https://github.com/expo/expo/pull/2369))
- add support for providing custom headers to send when requesting media source by [@sjchmiela](https://github.com/sjchmiela) ([#2431](https://github.com/expo/expo/pull/2431))
- add `Segment.alias` support by [@sjchmiela](https://github.com/sjchmiela) ([#2440](https://github.com/expo/expo/pull/2440))
- upgrade Android JSC to `r224109` by [@esamelson](https://github.com/esamelson) and [@Kmakinator](https://github.com/Kmakinator) ([#2437](https://github.com/expo/expo/pull/2437))
- add `LocalAuthentication.supportedAuthenticationTypes` method by [@bbarthec](https://github.com/bbarthec) ([#2450](https://github.com/expo/expo/pull/2450))
- add support for new Apple devices to `Constants` by [@tsapeta](https://github.com/tsapeta) ([#2410](https://github.com/expo/expo/pull/2410))

### 🐛 Bug fixes

- fix `react-native-svg` `toDataURL()` method throwing error (`undefined is not an object (evaluating 'RNSVGSvgViewManager.toDataURL')`) on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2492](https://github.com/expo/expo/pull/2492/files#diff-e7d5853f05c039302116a6f919672972))
- fix nested traits and properties being stringified on Android in the Segment module, instead of being reported as objects by [@sjchmiela](https://github.com/sjchmiela) ([expo-analytics-segment#2](https://github.com/expo/expo-analytics-segment/issues/2), [#2517](https://github.com/expo/expo/pull/2517))
- handle specified `behavior` on Android when authenticating with `Facebook` by [@EvanBacon](https://github.com/EvanBacon) ([`2ad86fad`](https://github.com/expo/expo/commit/2ad86fada7aacfa8fa0d50910e6d0c6130ca4840))
- fix `MediaLibrary` returning stale assets from `getAssetsAsync` by [@Aasfga](https://github.com/Aasfga) ([#2106](https://github.com/expo/expo/issues/2106), [`09cba8d`](https://github.com/expo/expo/commit/09cba8d1cc271a526e20c4c0f817a8370b7e1a56))
- fix `Pedometer.watchStepCount` erroring on Android by [@Szymon20000](https://github.com/Szymon20000) ([#2147](https://github.com/expo/expo/issues/2147), [`dea2967`](https://github.com/expo/expo/commit/dea2967c19ac948f84decedf311212b468b61945))
- fix Branch links not working when first opened on iOS by [@AdamPD](https://github.com/AdamPD) ([#2158](https://github.com/expo/expo/pull/2158))
- asking for `Permissions.BRIGHTNESS` no longer throws `AbstractMethodError` exception on some Android devices by [@bbarthec](https://github.com/bbarthec) ([#2342](https://github.com/expo/expo/pull/2342))
- properly handle some screen orientation configurations (on iPhone X `PortraitUpsideDown` is not supported) by changing sync `ScreenOrientation.allow` method to async `ScreenOrientation.allowAsync` throwing an error when trying to set an unsupported screen orientation configuration by [@bbarthec](https://github.com/bbarthec) ([`af2d7e3`](https://github.com/expo/expo/commit/af2d7e3c848cf49a47378970f23e080e1ada6755))
- fix `Linking.getInitialURL` returning a `customschemed://` URL instead of the one that really redirected to the application by [@schneidmaster](https://github.com/schneidmaster) ([#2352](https://github.com/expo/expo/pull/2352))
- fix `FaceDetector` settings not being applied on the first run by [@sjchmiela](https://github.com/sjchmiela) ([#2308](https://github.com/expo/expo/pull/2308))
- update `cameraview` AAR for it to contain `getCameraId()` method by [@sjchmiela](https://github.com/sjchmiela) ([expo-camera#4](https://github.com/expo/expo-camera/issues/4), [#2323](https://github.com/expo/expo/pull/2323))
- fix rerendering of ads provided by `FacebookAds` module by [@ide](https://github.com/ide) ([`85f2014`](https://github.com/expo/expo/commit/85f2014c2aa767892a37f194ec2c86f8f36d61d4))
- fix a fatal exception being thrown when pausing a resumable download on iOS 12 by [@sjchmiela](https://github.com/sjchmiela) ([#2404](https://github.com/expo/expo/pull/2404))
- fix universal modules being initialized twice by [@sjchmiela](https://github.com/sjchmiela) ([#2417](https://github.com/expo/expo/pull/2417))
- fix media players refusing to redirect from a HTTPS URL to another HTTPS URL on Android by [@sjchmiela](https://github.com/sjchmiela) ([#2403](https://github.com/expo/expo/pull/2403))
- fix `SMS.sendSMSAsync` not returning correct result on Android by [@bbarthec](https://github.com/bbarthec) ([#2452](https://github.com/expo/expo/pull/2452))
- fix barcode scanner not working on Pixel 2 by [@alexshikov](https://github.com/alexshikov) ([#2081](https://github.com/expo/expo/pull/2081))
- fix “Font doesn't support automatic scaling” errors on iOS < 12 by [@sjchmiela](https://github.com/sjchmiela) ([#2480](https://github.com/expo/expo/pull/2480))
- fix missing “Orientation” tag in `ImagePicker` EXIF data by [@bbarthec](https://github.com/bbarthec) ([#2432](https://github.com/expo/expo/pull/2432))
- fix `react-native-screens` compatibility with Expo by [@tsapeta](https://github.com/tsapeta) ([#2509](https://github.com/expo/expo/pull/2509))
