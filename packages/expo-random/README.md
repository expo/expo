# expo-random

Provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to `Node.js` core `crypto.randomBytes` API.

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/random/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-random
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

# Documentation

```js
import * as Random from 'expo-random';
```

## Methods

### `getRandomBytesAsync`

```js
getRandomBytesAsync(byteCount: number): Promise<Uint8Array>
```

Generates completely random bytes using native implementations. The `byteCount` property is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.

**Parameters**

| Name      | Type     | Description                                                                     |
| --------- | -------- | ------------------------------------------------------------------------------- |
| byteCount | `number` | A number within the range: **0...1024**. Anything else will throw a `TypeError` |

**Returns**

| Name        | Type                  | Description                                                      |
| ----------- | --------------------- | ---------------------------------------------------------------- |
| randomBytes | `Promise<Uint8Array>` | An array of random bytes with the same length as the `byteCount` |

**Example**

```js
const randomBytes = await Random.getRandomBytesAsync(3);
```

# Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import * as Random from 'expo-random';

export default class DemoView extends React.Component {
  async componentDidMount() {
    const randomBytes = await Random.getRandomBytesAsync(16);

    /* Some crypto operation... */
  }
  render() {
    return <View />;
  }
}
```
