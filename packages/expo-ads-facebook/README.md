# expo-ads-facebook

Facebook Audience SDK integration

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/facebook-ads.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/facebook-ads/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-ads-facebook
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-ads-facebook'
project(':expo-ads-facebook').projectDir = new File(rootProject.projectDir, '../node_modules/expo-ads-facebook/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-ads-facebook')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.ads.facebook.AdsFacebookPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new AdsFacebookPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
