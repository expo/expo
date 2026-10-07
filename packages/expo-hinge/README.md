# expo-hinge

Provides the device hinge angle and status on iPhone Duo, for the whole app, through a sync getter, a listener and a `useHinge()` hook. For a per-view SwiftUI modifier, see `onHingeChange` in `@expo/ui`.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/hinge/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/hinge/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/hinge/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-hinge
```

### Configure for iOS

Run `npx pod-install` after installing the npm package. Hinge updates need iOS 27.1 and a build made with the iOS 27.1 SDK (Xcode 27.1); older builds and devices without a hinge report `null`.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
