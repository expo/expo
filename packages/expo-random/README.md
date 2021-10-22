# expo-random

Provides a native interface for creating strong random bytes. With `Random` you can generate random values to address use cases that other APIs like the web's `crypto.getRandomValues` and Node's `crypto.randomBytes` might address.

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/random/).

You can add a polyfill for the web's `crypto.getRandomValues` by installing [expo-standard-web-crypto](https://github.com/expo/expo/tree/master/packages/expo-standard-web-crypto) and importing it in SDK 39 and higher:

```js
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

polyfillWebCrypto();
// crypto.getRandomValues is now globally defined
```

Other libraries like [react-native-get-random-values](https://github.com/LinusU/react-native-get-random-values) may work too.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-random
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.
