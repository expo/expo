# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.0.0 — 2020-11-17

### 🛠 Breaking changes

- Renamed all methods to include the 'Async' suffix:
  -   `initialize` to `initializeAsync`
  -   `setUserId` to `setUserIdAsync`
  -   `setUserProperties` to `setUserPropertiesAsync`
  -   `clearUserProperties` to `clearUserPropertiesAsync`
  -   `logEvent` to `logEventAsync`
  -   `logEventWithProperties` to `logEventWithPropertiesAsync`
  -   `setGroup` to `setGroupAsync`
  -   `setTrackingOptions` to `setTrackingOptionsAsync`
([#9212](https://github.com/expo/expo/pull/9212/) by [@cruzach](https://github.com/cruzach))
- All methods now return a Promise. ([#9212](https://github.com/expo/expo/pull/9212/) by [@cruzach](https://github.com/cruzach))

## 8.3.1 — 2020-08-24

### 🛠 Breaking changes

- Upgraded native Amplitude iOS library from `4.7.1` to `6.0.0`. This removes the IDFA code that was previously included with the Amplitude library. `disableIDFA` option for `Amplitude.setTrackingOptions` is removed. If you would like to collect the IDFA, you must be in the bare workflow. ([#9880](https://github.com/expo/expo/pull/9880) by [@bbarthec](https://github.com/bbarthec))

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
