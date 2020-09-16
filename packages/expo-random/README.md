# expo-random

Provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to `Node.js` core `crypto.randomBytes` API.

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/random/).

You can add a polyfill for `crypto.getRandomValues` by installing [react-native-get-random-values](https://github.com/LinusU/react-native-get-random-values) and importing it in SDK 39 and higher.

# Installation in bare React Native projects

### Add the package to your npm dependencies

```
expo install expo-random
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.
