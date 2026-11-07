# expo-media-session

Owns the audio session, audio focus and Now Playing for Expo packages.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/media-session/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/media-session/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/media-session/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-media-session
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

Now Playing needs the media playback service in **AndroidManifest.xml**. The config plugin adds it. See the [configuration section](https://docs.expo.dev/versions/latest/sdk/media-session/#configuration-in-app-config) of the API documentation for the plugin and the manual steps.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
