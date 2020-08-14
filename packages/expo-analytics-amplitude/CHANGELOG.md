# Changelog

## Unpublished

### 🛠 Breaking changes

- Renamed all methods to include the 'Async' suffix, and they now each return a promise:
  - `initialize` to `initializeAsync`
  - `setUserId` to `setUserIdAsync`
  - `setUserProperties` to `setUserPropertiesAsync`
  - `clearUserProperties` to `clearUserPropertiesAsync`
  - `logEvent` to `logEventAsync`
  - `logEventWithProperties` to `logEventWithPropertiesAsync`
  - `setGroup` to `setGroupAsync`
  - `setTrackingOptions` to `setTrackingOptionsAsync`

### 🎉 New features

### 🐛 Bug fixes

- Besides the two asynchronous methods `logEventAsync` and `logEventWithPropertiesAsync`, all methods no longer say they return promises.

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
