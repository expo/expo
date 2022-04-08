# expo-gl

Provides GLView that acts as OpenGL ES render target and gives GL context object implementing WebGL 2.0 specification.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/gl-view.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/gl-view/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/gl-view/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Install expo-gl-cpp

expo-gl requires that you also install and configure [expo-gl-cpp](https://github.com/expo/expo/tree/main/packages/expo-gl-cpp).

### Add the package to your npm dependencies

```
expo install expo-gl
```

### Compatibility

To use version `9.0.0` or newer of `expo-gl` you will need to use at least version `0.63.1` of React Native.

| expo-gl | react-native |
| ------- | ------------ |
| <=8.x.x | \*           |
| >=9.0.0 | >=0.63.1     |

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
