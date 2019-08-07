# expo-font

Load fonts at runtime and use them in React Native components.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/font.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/font/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-font
```

### Configure for JavaScript

We're planning on handling this automatically in the future, but for now you'll need to set `Font.processFontFamily` as a preprocessor for `StyleSheet`. Add the following code to the top of your `App.js`:

```js
import * as Font from 'expo-font';
import { StyleSheet } from 'react-native';
StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
