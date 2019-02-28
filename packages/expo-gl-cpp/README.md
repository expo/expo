# expo-gl-cpp

C++ bindings for WebGL 2.0 used in Expo GL module

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/gl-view.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/gl-view/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

Note: this should be used in conjunction with [expo-gl](https://github.com/expo/expo/tree/master/packages/expo-gl).

```
npm install expo-gl-cpp
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXGL-CPP', path: '../node_modules/expo-gl-cpp/cpp'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-gl-cpp'
project(':expo-gl-cpp').projectDir = new File(rootProject.projectDir, '../node_modules/expo-gl-cpp/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-gl-cpp')
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
