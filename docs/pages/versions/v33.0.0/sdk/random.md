---
title: Random
---

**`expo-random`** provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to `Node.js` core `crypto.randomBytes` API.

| 🍎 iOS | 💚 Android | 💻 Web |
| ------ | ---------- | ------ |
| ✅     | ✅         | ✅     |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-random`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-random).

# Docs

Once installed natively, the module can be accessed from the **`expo-random`** package.

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
