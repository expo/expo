# expo-analytics-amplitude

Provides access to Amplitude (https://amplitude.com/) mobile analytics. This module wraps Amplitude-iOS (https://github.com/amplitude/Amplitude-iOS) and Android (https://github.com/amplitude/Amplitude-Android) SDKs.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/amplitude.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/amplitude/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-analytics-amplitude
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXAmplitude', path: '../node_modules/expo-analytics-amplitude/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-analytics-amplitude'
project(':expo-analytics-amplitude').projectDir = new File(rootProject.projectDir, '../node_modules/expo-analytics-amplitude/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-analytics-amplitude')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.analytics.amplitude.AmplitudePackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new AmplitudePackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
