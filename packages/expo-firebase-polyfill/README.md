# expo-firebase-polyfill

Polyfill missing APIs for the Firebase JS SDK 🔥

# Installation

### Add the package to your npm dependencies

```
yarn install expo-firebase-polyfill
```

# Usage

Import the polyfill before importing the Firebase JS SDK.

```js
import "expo-firebase-polyfill";
import * as firebase from "firebase";
```

Besides polyfilling API's, this package also mitigates the long running timers problem on Android by capping all `setTimeout` calls to `60000` milleseconds.

> ```
> Setting a timer for a long period of time, i.e. multiple minutes, is a performance and correctness issue on Android as it keeps the timer module awake, and timers can only be called when the app is in the foreground. See https://github.com/facebook/react-native/issues/12981 for more info.
> ```


# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
