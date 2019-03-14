# unimodules-font-interface

Interface for managing fonts

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install unimodules-font-interface
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'UMFontInterface', path: '../node_modules/unimodules-font-interface/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':unimodules-font-interface'
project(':unimodules-font-interface').projectDir = new File(rootProject.projectDir, '../node_modules/unimodules-font-interface/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':unimodules-font-interface')
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
