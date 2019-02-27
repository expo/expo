# expo-errors

An internal module in Expo that helps us standardize error handling across all of our modules and provide a place for all error-related code to live.

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, this package is included in [`@unimodules/core`](https://github.com/unimodules/core), so if you use that then you already have this! If you are intentionally not using that package, follow the stpes below to install `expo-errors` manually.

### Add the package to your npm dependencies

```
npm install expo-errors
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXErrors', path: '../node_modules/expo-errors/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-errors'
project(':expo-errors').projectDir = new File(rootProject.projectDir, '../node_modules/expo-errors/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-errors')
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
