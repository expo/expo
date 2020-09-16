# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- `expo-facebook` All methods and platforms now return times in JS `Date` objects instead of seconds. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Error code `E_CONF_ERROR` has been replaced with `ERR_FACEBOOK_MISCONFIGURED`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Some instances of the error code `E_NO_INIT` in the client have been replaced with `ERR_FACEBOOK_UNINITIALIZED`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Some instances of the error code `E_FBLOGIN_ERROR` in the client have been replaced with `ERR_FACEBOOK_LOGIN`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `initializeAsync` now accepts a single argument of type [`FacebookInitializationOptions`](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/facebook.md#login-options), previously this method accepted two arguments: `appId: string` & `appName: string`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))

### 🎉 New features

- `expo-facebook` Added method to get Facebook authentication state. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))
- `expo-facebook` Added method to log out of Facebook `logOutAsync()`. ([#7101](https://github.com/expo/expo/pull/7101) by [@evanbacon](https://github.com/evanbacon))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
