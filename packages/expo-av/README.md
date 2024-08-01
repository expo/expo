<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/av/">
    <img
      src="../../.github/resources/expo-av.svg"
      alt="expo-av"
      height="64" />
  </a>
</p>

Expo universal module for Audio and Video playback

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/av/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/av/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/av/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-av
```

### Configure for Android

Add `android.permission.RECORD_AUDIO` permission to your manifest (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Configure for iOS

Add `NSMicrophoneUsageDescription` key to your `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your microphone</string>
```

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
