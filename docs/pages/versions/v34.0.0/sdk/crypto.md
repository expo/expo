---
title: Crypto
sourceCodeUrl: "https://github.com/expo/expo/tree/sdk-34/packages/expo-crypto"
---

import SnackInline from '~/components/plugins/SnackInline';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

Crypto enables you to hash data in an equivalent manner to the `Node.js` core `crypto` API.

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator |  Web  |
| ------ | ---------- | ------ | ------ | ------ |
| ✅     |  ✅     | ✅     | ✅     | ✅    |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-crypto`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-crypto).

## Usage

<SnackInline label='Basic Crypto usage' templateId='crypto' dependencies={['expo-crypto']}>

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import * as Crypto from 'expo-crypto';

export default class DemoView extends React.Component {
  async componentDidMount() {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'Github stars are neat 🌟'
    );
    console.log('Digest: ', digest);

    /* Some crypto operation... */
  }
  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Crypto Module Example</Text>
      </View>
    );
  }
}
```
</SnackInline>

## API

```js
import * as Crypto from 'expo-crypto';
```

<TableOfContentSection title='Methods' contents={['Crypto.digestStringAsync(algorithm, data, options)']} />

<TableOfContentSection title='Types' contents={['CryptoDigestAlgorithm', 'CryptoEncoding', 'CryptoDigestOptions']} />

<TableOfContentSection title='Error Codes' contents={['ERR_CRYPTO_UNAVAILABLE', 'ERR_CRYPTO_DIGEST']} />

## Methods

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

#### Arguments

| Name      | Type                                      | Description                                                                         |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| algorithm | [`CryptoDigestAlgorithm`][algorithm-link] | Transforms a value into a fixed-size hash (usually shorter than the initial value). |
| data      | `string`                                  | The value that will be used to generate a digest.                                   |
| options   | `CryptoDigestOptions`                     | Format of the digest string. Defaults to: `CryptoDigestOptions.HEX`                 |

#### Returns

| Name   | Type              | Description                                          |
| ------ | ----------------- | ---------------------------------------------------- |
| digest | `Promise<string>` | Resolves into a value representing the hashed input. |

#### Error Codes

- [`ERR_CRYPTO_UNAVAILABLE`](#errcryptounavailable)
- [`ERR_CRYPTO_DIGEST`](#errcryptodigest)

#### Example

```ts
const digest = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA512,
  '🥓 Easy to Digest! 💙'
);
```

## Types

### `CryptoDigestAlgorithm`

[`Cryptographic hash function`][algorithm-link] is an algorithm that can be used to generate a checksum value. They have a variety of applications in cryptography.

> Cryptographic hash functions like `SHA1`, `MD5` are **vulnerable**! Attacks have been proven to significantly reduce their collision resistance.

| Name              | Type   | Description | Collision Resistant | 🍎 iOS | 💚 Android | 💻 Web |
| ----------------- | ------ | ----------- | ------------------- | ------ | ---------- | ------ |
| [SHA1][sha-def]   | string | `160` bits  | ❌                  | ✅     | ✅         | ✅     |
| [SHA256][sha-def] | string | `256` bits  | ✅                  | ✅     | ✅         | ✅     |
| [SHA384][sha-def] | string | `384` bits  | ✅                  | ✅     | ✅         | ✅     |
| [SHA512][sha-def] | string | `512` bits  | ✅                  | ✅     | ✅         | ✅     |
| MD2               | string | `128` bits  | ❌                  | ✅     | ✅         | ❌     |
| MD4               | string | `128` bits  | ❌                  | ✅     | ✅         | ❌     |
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

### `ERR_CRYPTO_UNAVAILABLE`
(Web only) Access to the WebCrypto API is restricted to secure origins (https). You can run your web project from a secure origin with `expo start --https`.

### `ERR_CRYPTO_DIGEST`
An invalid encoding type provided.


<!-- External Links -->

[algorithm-link]: https://developer.mozilla.org/en-US/docs/Glossary/Cryptographic_hash_function
[sha-def]: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
