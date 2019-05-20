# expo-random

Provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to `Node.js` core `crypto.randomBytes` API.

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects as of SDK 33. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-random
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

No additional set up necessary.

# Docoumentation

```js
// in managed apps:
import { Random } from 'expo';

// in bare apps:
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
