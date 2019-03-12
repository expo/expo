# expo-image-picker

Provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/imagepicker.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/imagepicker/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-image-picker
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXImagePicker', path: '../node_modules/expo-image-picker/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-image-picker'
project(':expo-image-picker').projectDir = new File(rootProject.projectDir, '../node_modules/expo-image-picker/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-image-picker')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.imagepicker.ImagePickerPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new ImagePickerPackage()
), Arrays.<SingletonModule>asList());
```

4. In `AndroidManifest.xml` add the following `activity` within `application`:

```xml
<activity
  android:name="com.theartofdev.edmodo.cropper.CropImageActivity"
  android:theme="@style/Base.Theme.AppCompat">
</activity>
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
