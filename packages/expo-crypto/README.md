# expo-crypto

**`expo-crypto`** enables you to encrypt data in an equivalent manner to the `Node.js` core `crypto` API.

- [x] **TypeScript**
- [x] **Unit-Tests**
- [x] **Universal Module**
- [x] **Test Suite**

| 🍎 iOS | 💚 Android | 💻 Web |
| ------ | ---------- | ------ |
| ✅     | ✅         | ✅     |

# Installation

<details>
<summary>📚 Expand Installation</summary>

First, you need to install the package from `npm` registry.

```sh
npm install expo-crypto

or

yarn add expo-crypto
```

## iOS

**`Podfile`**: Include the local CocoaPod

<details>
<summary>👉 Expand Code</summary>

```ruby
pod 'EXCrypto', path: '../node_modules/expo-crypto/ios'
```

</details>

Run: `$ pod install` to sync the pods with XCode.

## Android

**`android/settings.gradle`**: Make the library accessible to Android

<details>
<summary>👉 Expand Code</summary>

```gradle
include ':expo-crypto'
project(':expo-crypto').projectDir = new File(rootProject.projectDir, '../node_modules/expo-crypto/android')
```

and if not already included

```gradle
include ':expo-core'
project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')
```

</details>

**`android/app/build.gradle`**: Insert the following lines inside the _`dependencies`_ block.

<details>
<summary>👉 Expand Code</summary>

```gradle
api project(':expo-crypto')
```

and if not already included

```gradle
api project(':expo-core')
```

</details>

**`./android/app/src/main/java/host/exp/exponent/MainActivity.java`**: Import, then export the module from your _`expoPackages`_:

<details>
<summary>👉 Expand Code</summary>

```java
/**
 * At the top of the file.
 * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
 */
import expo.modules.crypto.CryptoPackage;

// Later in the file...

@Override
public List<Package> expoPackages() {
  /* Here you can add your own packages. */
  return Arrays.<Package>asList(
    /* Include this. */
    new CryptoPackage()
  );
}
```

</details>

</details>

> **Notice** 🛠 The native installation flow is under maintenance.

# Docs

Once installed natively, the module can be accessed from the **`expo-crypto`** package.

**Bare React Native**

```js
import * as Crypto from 'expo-crypto';
```

**Expo**

```js
import { Crypto } from 'expo';
```

## Methods

### `digestStringAsync`

```ts
digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string,
  options: CryptoDigestOptions = { encoding: CryptoEncoding.HEX }
): Promise<string>
```

The `digestStringAsync()` method of `Crypto` generates a digest of the supplied `data` string with the provided digest `algorithm`.
A digest is a short fixed-length value derived from some variable-length input. **Cryptographic digests** should exhibit _collision-resistance_, meaning that it's very difficult to generate multiple inputs that have equal digest values.
You can specify the returned string format as one of `CryptoEncoding`. By default the resolved value will be formatted as a `HEX` string.

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

**Example**

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

# Usage

```ts
import React from 'react';
import { View } from 'react-native';
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
    return <View />;
  }
}
```

<!-- External Links -->

[algorithm-link]: https://developer.mozilla.org/en-US/docs/Glossary/Cryptographic_hash_function
[sha-def]: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
