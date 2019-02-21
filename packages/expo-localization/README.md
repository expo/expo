# expo-localization

`expo-localization` provides an interface for native user localization information.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/localization.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/localization/)

# Installation

This package is pre-installed in **managed** projects that are initialized with `expo-cli`. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/react-native-platform` package](https://github.com/unimodules/react-native-platform) before continuing.

### Add the package to your npm dependencies

```
npm install expo-localization
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXLocalization', path: '../node_modules/expo-localization/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-localization'
project(':expo-localization').projectDir = new File(rootProject.projectDir, '../node_modules/expo-localization/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-localization')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.localization.LocalizationPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new LocalizationPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).