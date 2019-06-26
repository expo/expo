# expo-gl

Provides GLView that acts as OpenGL ES render target and gives GL context object implementing WebGL 2.0 specification.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/gl-view.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/gl-view/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Install expo-gl-cpp

expo-gl requires that you also install and configure [expo-gl-cpp](https://github.com/expo/expo/tree/master/packages/expo-gl-cpp).

### Add the package to your npm dependencies

```
npm install expo-gl
```

### Compatibility

To use `expo-gl` with React Native 0.58.0 or newer you will need to use `5.x.x` version of `expo-gl` and at least `0.4.0` of `react-native-unimodules`. Here is the table showing compatibility between these three packages:

| expo-gl | react-native-unimodules | react-native |
| ------- | ----------------------- | ------------ |
| <=4.x.x | 0.3.x                   | <=0.57.x     |
| >=5.0.0 | >=0.4.0                 | *            |

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
