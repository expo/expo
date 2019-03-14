# unimodules-constants-interface

An interface for unimodules-constants.

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install unimodules-constants-interface
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXConstantsInterface', path: '../node_modules/unimodules-constants-interface/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':unimodules-constants-interface'
project(':unimodules-constants-interface').projectDir = new File(rootProject.projectDir, '../node_modules/unimodules-constants-interface/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':unimodules-constants-interface')
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
