# expo-gl

Provides GLView that acts as OpenGL ES render target and gives GL context object implementing WebGL 2.0 specification.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/gl-view.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/gl-view/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Install expo-gl-cpp

expo-gl requires that you also install and configure [expo-gl-cpp](https://github.com/expo/expo/tree/master/packages/expo-gl-cpp).

### Add the package to your npm dependencies

```
npm install expo-gl
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXGL', path: '../node_modules/expo-gl/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-gl'
project(':expo-gl').projectDir = new File(rootProject.projectDir, '../node_modules/expo-gl/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-gl')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.expo.modules.gl.GLPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new GLPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
