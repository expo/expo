---
id: platform
title: Platform
---

## Example

```js
import React from 'react';
import { Platform, StyleSheet, Text, ScrollView } from 'react-native';

const App = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>OS</Text>
      <Text style={styles.value}>{Platform.OS}</Text>
      <Text>OS Version</Text>
      <Text style={styles.value}>{Platform.Version}</Text>
      <Text>isTV</Text>
      <Text style={styles.value}>{Platform.isTV.toString()}</Text>
      {Platform.OS === 'ios' && (
        <>
          <Text>isPad</Text>
          <Text style={styles.value}>{Platform.isPad.toString()}</Text>
        </>
      )}
      <Text>Constants</Text>
      <Text style={styles.value}>{JSON.stringify(Platform.constants, null, 2)}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontWeight: '600',
    padding: 4,
    marginBottom: 8,
  },
});

export default App;
```

---

# Reference

## Properties

### `constants`

```js
Platform.constants;
```

Returns an object which contains all available common and specific constants related to the platform.

**Properties:**

| <div className="widerColumn">Name</div> | Type    | Optional | Description                                                                                                                                                                                       |
| --------------------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isTesting                               | boolean | No       |                                                                                                                                                                                                   |
| reactNativeVersion                      | object  | No       | Information about React Native version. Keys are `major`, `minor`, `patch` with optional `prerelease` and values are `number`s.                                                                   |
| Version **(Android)**                   | number  | No       | OS version constant specific to Android.                                                                                                                                                          |
| Release **(Android)**                   | string  | No       |                                                                                                                                                                                                   |
| Serial **(Android)**                    | string  | No       | Hardware serial number of an Android device.                                                                                                                                                      |
| Fingerprint **(Android)**               | string  | No       | A string that uniquely identifies the build.                                                                                                                                                      |
| Model **(Android)**                     | string  | No       | The end-user-visible name for the Android device.                                                                                                                                                 |
| Brand **(Android)**                     | string  | No       | The consumer-visible brand with which the product/hardware will be associated.                                                                                                                    |
| Manufacturer **(Android)**              | string  | No       | The manufacturer of the Android device.                                                                                                                                                           |
| ServerHost **(Android)**                | string  | Yes      |                                                                                                                                                                                                   |
| uiMode **(Android)**                    | string  | No       | Possible values are: `'car'`, `'desk'`, `'normal'`,`'tv'`, `'watch'` and `'unknown'`. Read more about [Android ModeType](https://developer.android.com/reference/android/app/UiModeManager.html). |
| forceTouchAvailable **(iOS)**           | boolean | No       | Indicate the availability of 3D Touch on a device.                                                                                                                                                |
| interfaceIdiom **(iOS)**                | string  | No       | The interface type for the device. Read more about [UIUserInterfaceIdiom](https://developer.apple.com/documentation/uikit/uiuserinterfaceidiom).                                                  |
| osVersion **(iOS)**                     | string  | No       | OS version constant specific to iOS.                                                                                                                                                              |
| systemName **(iOS)**                    | string  | No       | OS name constant specific to iOS.                                                                                                                                                                 |

---

### `isPad` **(iOS)**

```js
Platform.isPad;
```

Returns a boolean which defines if device is an iPad.

| Type    |
| ------- |
| boolean |

---

### `isTV`

```js
Platform.isTV;
```

Returns a boolean which defines if device is a TV.

| Type    |
| ------- |
| boolean |

---

### `isTesting`

```js
Platform.isTesting;
```

Returns a boolean which defines if application is running in Developer Mode with testing flag set.

| Type    |
| ------- |
| boolean |

---

### `OS`

```js
static Platform.OS
```

Returns string value representing the current OS.

| Type                       |
| -------------------------- |
| enum(`'android'`, `'ios'`) |

---

### `Version`

```js
Platform.Version;
```

Returns the version of the OS.

| Type                                       |
| ------------------------------------------ |
| number **(Android)**<hr />string **(iOS)** |

## Methods

### `select()`

```js
static select(config: object): any
```

Returns the most fitting value for the platform you are currently running on.

#### Parameters:

| Name   | Type   | Required | Description                   |
| ------ | ------ | -------- | ----------------------------- |
| config | object | Yes      | See config description below. |

Select method returns the most fitting value for the platform you are currently running on. That is, if you're running on a phone, `android` and `ios` keys will take preference. If those are not specified, `native` key will be used and then the `default` key.

The `config` parameter is an object with the following keys:

- `android` (any)
- `ios` (any)
- `native` (any)
- `default` (any)

**Example usage:**

```js
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      android: {
        backgroundColor: 'green',
      },
      ios: {
        backgroundColor: 'red',
      },
      default: {
        // other platforms, web for example
        backgroundColor: 'blue',
      },
    }),
  },
});
```

This will result in a container having `flex: 1` on all platforms, a green background color on Android, a red background color on iOS, and a blue background color on other platforms.

Since the value of the corresponding platform key can be of type `any`, [`select`](#select) method can also be used to return platform-specific components, like below:

```js
const Component = Platform.select({
  ios: () => require('ComponentIOS'),
  android: () => require('ComponentAndroid'),
})();

<Component />;
```

```js
const Component = Platform.select({
  native: () => require('ComponentForNative'),
  default: () => require('ComponentForWeb'),
})();

<Component />;
```
