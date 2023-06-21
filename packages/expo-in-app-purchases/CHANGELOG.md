# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 14.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 14.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 14.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 14.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 14.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix null error in purchaseItemAsync when details argument is not passed [#18272](https://github.com/expo/expo/pull/18272)

## 13.1.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 13.0.0 — 2022-04-18

### 🛠 Breaking changes

- Added `obfuscatedAccountId`, `obfuscatedProfileId` and `isVrPurchaseFlow` as options to `purchaseItemAsync` for Android in-app purchases. The second arguemnt of `purchaseItemAsync` is no longer `oldPurchaseToken` and must be a `IAPPurchaseItemOptions` object instead. You can still pass `oldPurchaseToken` via the `IAPPurchaseItemOptions` object. ([#16670](https://github.com/expo/expo/pull/16670) by [@lukebrandonfarrell](https://github.com/lukebrandonfarrell))

### 🐛 Bug fixes

- Removed the unused `jcenter()` maven dependencies. ([#16846](https://github.com/expo/expo/pull/16846) by [@kudo](https://github.com/kudo))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 12.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Cache products on iOS when calling `getProductsAsync`, so that `purchaseItemAsync` no longer needs to make a second request to StoreKit. This matches the Android implementation. ([#13961](https://github.com/expo/expo/pull/13961) by [@cruzach](https://github.com/cruzach))
- Extract `getPurchaseHistoryAsync` embedded parameter type to `IAPPurchaseHistoryOptions` type. ([#14217](https://github.com/expo/expo/pull/14217) by [@Simek](https://github.com/Simek))
- Use correct enum types instead of more general `number` in few type definitions. ([#14217](https://github.com/expo/expo/pull/14217) by [@Simek](https://github.com/Simek))

## 11.0.0 — 2021-08-10

### 🛠 Breaking changes

- `purchaseItemAsync` no longer accepts the old SKU as the second (optional) argument. Instead, this method now accepts the `purchaseToken` of the purchase you are replacing as the second argument. You can get this value via `getPurchaseHistoryAsync`. This change only affects Android. ([#13884](https://github.com/expo/expo/pull/13884) by [@cruzach](https://github.com/cruzach))
- `getPurchaseHistoryAsync` no longer accepts a boolean parameter. Instead, it accepts an object containing the key `useGooglePlayCache`. `useGooglePlayCache` functions similarly to the the previous `refresh` parameter, except it is clearer in naming. If you had `refresh` as false, you should pass `useGooglePlayCache: true`. If `refresh` was true, you should pass `useGooglePlayCache: false`. Please see the [docs](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/in-app-purchases.md#inapppurchasesgetpurchasehistoryasyncrefresh-boolean) for more information. ([#13942](https://github.com/expo/expo/pull/13942) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Made the arguments that were labeled as 'optional' on iOS for `getPurchaseHistoryAsync` and `finishTransactionAsync` actually optional. ([#13904](https://github.com/expo/expo/pull/13904) by [@cruzach](https://github.com/cruzach))

### 💡 Others

- Updated Google Play Billing from v2 to v4. ([#13884](https://github.com/expo/expo/pull/13884) by [@cruzach](https://github.com/cruzach))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Improved `IAPQueryResponse` types. [#13104](https://github.com/expo/expo/pull/13104) by [@hehex9](https://github.com/hehex9)

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.1.1 — 2021-03-10

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.1.0 — 2021-02-02

### 🎉 New features

- Map more iOS error codes to JS/TS error codes ([#11773](https://github.com/expo/expo/pull/11773)) by @danmaas
- Add defensive null checks so that bugs in the Android payments API do not cause crashes ([#11773](https://github.com/expo/expo/pull/11773)) by @danmaas
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.1.0 — 2020-09-21

### 🐛 Bug fixes

- `errorCodeNativeToJS` now returns 0 by default. This fixes a build error that would occur on Xcode 12. ([#10224](https://github.com/expo/expo/pull/10224) by [@nabettu](https://github.com/nabettu))

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Calling `connectAsync` no longer queries the purchase history. This way, on iOS, the user is not prompted to log into their Apple ID until `getPurchaseHistoryAsync` is called. Thanks to @sergeichestakov for implementing this in https://github.com/expo/expo/pull/8577.

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
