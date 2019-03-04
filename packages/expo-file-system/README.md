# expo-file-system

Provides access to the local file system on the device.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/filesystem.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/filesystem/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, this package is included in [`@unimodules/core`](https://github.com/unimodules/core), so if you use that then you already have this! If you are intentionally not using that package, follow the stpes below to install `expo-file-system` manually.

### Add the package to your npm dependencies

```
npm install expo-file-system
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXFileSystem', path: '../node_modules/expo-file-system/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-file-system'
project(':expo-file-system').projectDir = new File(rootProject.projectDir, '../node_modules/expo-file-system/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-file-system')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.filesystem.FileSystemPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new FileSystemPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
