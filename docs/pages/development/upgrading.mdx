---
title: Upgrading
sidebar_title: Upgrading
---

While we try to make upgrading the `expo-dev-client` package as painless as possible, occasionally you will need to make small changes to your project which are listed on this page.

## 0.8.0

You can safely remove the following line from the `react-native.config.js`:

```js
module.exports = {
  dependencies: {
    ...require('expo-dev-client/dependencies'), // to remove
    // ...
  },
};
```

## 0.6.0

**For managed workflow projects, and bare projects with the `expo` or `react-native-unimodules` package**, no additional changes are needed.

**For bare workflow projects with no other Expo modules nor `react-native-unimodules`**, the following additional changes are needed when upgrading to `expo-dev-client@0.6.x`:

### iOS

In `ios/Podfile`, change the deployment target to `platform :ios, '12.0'` and add the following lines inside the main target:

```ruby
pod 'EXJSONUtils', path: '../node_modules/expo-json-utils/ios', :configurations => :debug
pod 'EXManifests', path: '../node_modules/expo-manifests/ios', :configurations => :debug
```

Rerun `pod install` before reopening your project.

### Android

In `android/settings.gradle`, add the following lines:

```groovy
include ':expo-json-utils'
project(':expo-json-utils').projectDir = new File('../node_modules/expo-json-utils/android')

include ':expo-manifests'
project(':expo-manifests').projectDir = new File('../node_modules/expo-manifests/android')
```
