# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 5.7.0 — 2020-11-17

### 🐛 Bug fixes

- Fixed invalid numbers of listeners being considered unregistered on iOS, resulting in _Attempted to remove more '{ModuleName}' listeners than added._ errors. ([#10771](https://github.com/expo/expo/pull/10771) by [@sjchmiela](https://github.com/sjchmiela))

## 5.6.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 5.5.0 — 2020-08-11

### 🛠 Breaking changes

- Deprecate `RCTDeviceEventEmitter` in favor of the renamed `DeviceEventEmitter`. ([#8826](https://github.com/expo/expo/pull/8826) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Remove `prop-types` ([#8681](https://github.com/expo/expo/pull/8681) by [@EvanBacon](https://github.com/EvanBacon))
- Add `Platform.isDOMAvailable` to detect web browser environments. ([#8645](https://github.com/expo/expo/pull/8645) by [@EvanBacon](https://github.com/EvanBacon))
- Add `Platform.select()` method to switch values between platforms. ([#8645](https://github.com/expo/expo/pull/8645) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade to `react-native-web@~0.12`. ([#9023](https://github.com/expo/expo/pull/9023) by [@EvanBacon](https://github.com/EvanBacon))

## 5.4.0 — 2020-05-29

### 🐛 Bug fixes

- Made it possible for SSR (node) environments that don't bundle using platform extensions to work without resolving native code. ([#8502](https://github.com/expo/expo/pull/8502) by [@EvanBacon](https://github.com/EvanBacon))

## 5.3.0 — 2020-05-27

_This version does not introduce any user-facing changes._
