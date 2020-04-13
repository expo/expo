# expo-screen-orientation

Allows you to manage the orientation of your app's interface.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/screen-orientation.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/screen-orientation/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/screen-orientation/). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-screen-orientation
```

### Configure for iOS

1. Run `pod install` in the ios directory after installing the npm package.
2. Open the `AppDelegate.m` of your application.
3. Import `<EXScreenOrientation/EXScreenOrientationViewController.h>`
4. In `-application:didFinishLaunchingWithOptions:launchOptions` change default `root view controller` to `EXScreenOrientationViewController`:

   Replace

   ```objc
   UIViewController *rootViewController = [UIViewController new];
   ```

   with:

   ```objc
   UIViewController *rootViewController = [[EXScreenOrientationViewController alloc] init]; // The default screen orientation will be set to `portrait`.
   ```

   or if you want to change the default screen orientation, with:

   ```objc
   UIViewController *rootViewController =  [[EXScreenOrientationViewController alloc] initWithDefaultScreenOrientationMask:UIInterfaceOrientationMaskPortrait]; // through parameter you can specify your default orientation mask.
   ```

   For more information about available orientation masks, check out [UIInterfaceOrientationMask](https://developer.apple.com/documentation/uikit/uiinterfaceorientationmask?language=objc)

> **Note** if you are using a custom view controller, the controller will need to extend the `EXScreenOrientationViewController`.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
