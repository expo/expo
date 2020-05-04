# Changelog

## master

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed initial notification not being emitted to `NotificationResponse` listener on iOS ([#7958](https://github.com/expo/expo/pull/7958) by [@sjchmiela](https://github.com/sjchmiela))

## [0.1.3] - 2020-04-30

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed custom notification sounds not being applied properly to notifications and channels ([#8036](https://github.com/expo/expo/pull/8036) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed iOS rejecting the Promise to schedule a notification if `sound` is not empty or a boolean ([#8036](https://github.com/expo/expo/pull/8036) by [@sjchmiela](https://github.com/sjchmiela))

## [0.1.2] - 2020-04-21

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed interpretation of `Date` and `number` triggers when calling `scheduleNotificationAsync` on iOS ([#7942](https://github.com/expo/expo/pull/7942) by [@sjchmiela](https://github.com/sjchmiela))
