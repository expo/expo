---
title: Random
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-random'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-random`** provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to `Node.js` core `crypto.randomBytes` API.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-random" />

## Usage

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

## API

```js
import * as Random from 'expo-random';
```

## Methods

### `Random.getRandomBytesAsync(byteCount)`

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
