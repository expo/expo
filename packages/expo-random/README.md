# expo-random

**`expo-random`** provides a native interface for creating strong random bytes. With `Random` you can create values equivalent to `Node.js` core `crypto.randomBytes` API.

- [x] **TypeScript**
- [x] **Unit-Tests**
- [x] **Universal Module**
- [x] **Physical Tests Suite Tests**

| 🍎 iOS | 💚 Android | 💻 Web |
| ------ | ---------- | ------ |
| ✅     | ✅         | ✅     |

# Installation

<details>
<summary>📚 Expand Installation</summary>

First, you need to install the package from `npm` registry.

```sh
npm install expo-random

or

yarn add expo-random
```

## iOS

**`Podfile`**: Include the local CocoaPod

<details>
<summary>👉 Expand Code</summary>

```ruby
pod 'EXRandom', path: '../node_modules/expo-random/ios'
```

</details>

Run: `$ pod install` to sync the pods with XCode.

## Android

**`android/settings.gradle`**: Make the library accessible to Android

<details>
<summary>👉 Expand Code</summary>

```gradle
include ':expo-random'
project(':expo-random').projectDir = new File(rootProject.projectDir, '../node_modules/expo-random/android')
```

and if not already included

```gradle
include ':unimodules-core'
project(':unimodules-core').projectDir = new File(rootProject.projectDir, '../node_modules/@unimodules/core/android')
```

</details>

**`android/app/build.gradle`**: Insert the following lines inside the _`dependencies`_ block.

<details>
<summary>👉 Expand Code</summary>

```gradle
api project(':expo-random')
```

and if not already included

```gradle
api project(':unimodules-core')
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
import expo.modules.random.RandomPackage;

// Later in the file...

@Override
public List<Package> expoPackages() {
  /* Here you can add your own packages. */
  return Arrays.<Package>asList(
    /* Include this. */
    new RandomPackage()
  );
}
```

</details>

</details>

> **Notice** 🛠 The native installation flow is under maintenance.

# Docs

Once installed natively, the module can be accessed from the **`expo-random`** package.

**Bare React Native**

```js
import * as Random from 'expo-random';
```

**Expo**

```js
import { Random } from 'expo';
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
