# expo-screen-orientation

Allows you to manage the orientation of your app's interface.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/screen-orientation.mdx)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/screen-orientation/). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install expo-screen-orientation
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

The default [UIInterfaceOrientationMask](https://developer.apple.com/documentation/uikit/uiinterfaceorientationmask?language=objc) mask is `UIInterfaceOrientationMaskPortrait`. You can optionally add `EXDefaultScreenOrientationMask` key in your `Info.plist` to change the default orientation mask, e.g.

```xml
<key>EXDefaultScreenOrientationMask</key>
<string>UIInterfaceOrientationMaskAllButUpsideDown</string>
```

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
