# expo-av

Expo universal module for Audio and Video playback

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/av.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/av/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-av
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXAV', path: '../node_modules/expo-av/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-av'
project(':expo-av').projectDir = new File(rootProject.projectDir, '../node_modules/expo-av/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-av')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.av.AVPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new AVPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
