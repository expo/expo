# expo-screen-capture

This module allows you to prevent users from screen recording or taking screenshots of your app.

> Currently, taking screenshots on iOS cannot be prevented. This is due to underlying OS limitations.

## API documentation

## Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/screen-capture/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```sh
expo install expo-screen-capture
```

### Configure for iOS

```sh
npx pod-install
```

### Configure for Android

No extra configuration necessary

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
