# expo-google-sign-in

Enables native Google authentication features in your app! This module can only be used in ExpoKit, or a Standalone Expo app. For in-depth setup, check out this guide: https://blog.expo.io/react-native-google-sign-in-with-expo-d1707579a7ce

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/google-sign-in.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/google-sign-in/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-google-sign-in
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXGoogleSignIn', path: '../node_modules/expo-google-sign-in/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-google-sign-in'
project(':expo-google-sign-in').projectDir = new File(rootProject.projectDir, '../node_modules/expo-google-sign-in/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-google-sign-in')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.expo.modules.google.signin.GoogleSignInPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new GoogleSignInPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
