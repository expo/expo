---
title: Random
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-40/packages/expo-random'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

`expo-random` provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to Node.js core `crypto.randomBytes` API. `expo-random` also works with `expo-standard-web-crypto`, which implements the W3C Crypto API for generating random bytes.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-random" />

## API

```js
import * as Random from 'expo-random';
```

## Methods

### `Random.getRandomBytes(byteCount)`

Generates completely random bytes using native implementations. The `byteCount` property is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.

## Arguments

- **byteCount (_number_)** -- A number within the range: **0...1024**. Anything else will throw a `TypeError`.

## Returns

- **randomBytes (_Uint8Array_)** -- An array of random bytes with the same length as the `byteCount`.

### `Random.getRandomBytesAsync(byteCount)`

Generates completely random bytes using native implementations. The `byteCount` property is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.

## Arguments

- **byteCount (_number_)** -- A number within the range: **0...1024**. Anything else will throw a `TypeError`.

## Returns

- **randomBytes (_Promise&lt;Uint8Array&gt;_)** -- An array of random bytes with the same length as the `byteCount`.
