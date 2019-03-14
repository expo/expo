# expo-ads-admob

Provides support for the Google AdMob SDK (https://www.google.com/admob/) for mobile advertising. This module is largely based of the react-native-admob (https://github.com/sbugert/react-native-admob) module, as the documentation and questions surrounding that module may prove helpful. A simple example implementing AdMob SDK can be found at https://github.com/deadcoder0904/expo-google-admob.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/admob.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/admob/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-ads-admob
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXAdsAdMob', path: '../node_modules/expo-ads-admob/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-ads-admob'
project(':expo-ads-admob').projectDir = new File(rootProject.projectDir, '../node_modules/expo-ads-admob/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-ads-admob')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.ads.admob.AdMobPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new AdMobPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
