---
title: Crypto
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-crypto'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

`expo-crypto` enables you to hash data in an equivalent manner to the Node.js core `crypto` API.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-crypto" />

## Usage

<SnackInline label='Basic Crypto usage' dependencies={['expo-crypto']}>

```jsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Crypto from 'expo-crypto';

export default function App() {
  useEffect(() => {
    (async () => {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        'GitHub stars are neat 🌟'
      );
      console.log('Digest: ', digest);
      /* Some crypto operation... */
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Crypto Module Example</Text>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import * as Crypto from 'expo-crypto';
```

### `Crypto.digestStringAsync(algorithm, data, options)`

```ts
digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string,
  options: CryptoDigestOptions = { encoding: CryptoEncoding.HEX }
): Promise<string>
```

The `digestStringAsync()` method of `Crypto` generates a digest of the supplied `data` string with the provided digest `algorithm`.
A digest is a short fixed-length value derived from some variable-length input. **Cryptographic digests** should exhibit _collision-resistance_, meaning that it's very difficult to generate multiple inputs that have equal digest values.
You can specify the returned string format as one of `CryptoEncoding`. By default the resolved value will be formatted as a `HEX` string. On web, this method can only be called from a secure origin (https) otherwise an error will be thrown.

| 🍎 iOS | 💚 Android | 💻 Web |
| ------ | ---------- | ------ |
| ✅     | ✅         | ✅     |

**Parameters**

| Name      | Type                                      | Description                                                                         |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| algorithm | [`CryptoDigestAlgorithm`][algorithm-link] | Transforms a value into a fixed-size hash (usually shorter than the initial value). |
| data      | `string`                                  | The value that will be used to generate a digest.                                   |
| options   | `CryptoDigestOptions`                     | Format of the digest string. Defaults to: `CryptoDigestOptions.HEX`                 |

**Returns**

| Name   | Type              | Description                                          |
| ------ | ----------------- | ---------------------------------------------------- |
| digest | `Promise<string>` | Resolves into a value representing the hashed input. |

#### Error Codes

- `ERR_CRYPTO_UNAVAILABLE` - (Web only) Access to the WebCrypto API is restricted to secure origins (https). You can run your web project from a secure origin with `expo start --https`.
- `ERR_CRYPTO_DIGEST` - An invalid encoding type provided.

**Example**

```ts
const digest = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA512,
  '🥓 Easy to Digest! 💙'
);
```

## Types

### `CryptoDigestAlgorithm`

| Name              | Type   | Description | Collision Resistant | 🍎 iOS | 💚 Android | 💻 Web |
| ----------------- | ------ | ----------- | ------------------- | ------ | ---------- | ------ |
| [SHA1][sha-def]   | string | `160` bits  | ❌                  | ✅     | ✅         | ✅     |
| [SHA256][sha-def] | string | `256` bits  | ✅                  | ✅     | ✅         | ✅     |
| [SHA384][sha-def] | string | `384` bits  | ✅                  | ✅     | ✅         | ✅     |
| [SHA512][sha-def] | string | `512` bits  | ✅                  | ✅     | ✅         | ✅     |
| MD2               | string | `128` bits  | ❌                  | ✅     | ❌         | ❌     |
| MD4               | string | `128` bits  | ❌                  | ✅     | ❌         | ❌     |
| MD5               | string | `128` bits  | ❌                  | ✅     | ✅         | ❌     |

### `CryptoEncoding`

| Name   | Type       | 🍎 iOS | 💚 Android | 💻 Web |
| ------ | ---------- | ------ | ---------- | ------ |
| HEX    | `'hex'`    | ✅     | ✅         | ✅     |
| BASE64 | `'base64'` | ✅     | ✅         | ✅     |

**Base64 Format**

- Has trailing padding.
- Does not wrap lines.
- Does not have a trailing newline.

### `CryptoDigestOptions`

| Name     | Type             | Description                      | 🍎 iOS | 💚 Android | 💻 Web |
| -------- | ---------------- | -------------------------------- | ------ | ---------- | ------ |
| encoding | `CryptoEncoding` | Format the digest is returned in | ✅     | ✅         | ✅     |

## Error Codes

| Code                   | Description                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- |
| ERR_CRYPTO_UNAVAILABLE | (Web only) Access to the WebCrypto API is restricted to secure origins (https). |
| ERR_CRYPTO_DIGEST      | An invalid encoding type provided.                                              |

{/* External Links */}

[sha-def]: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
