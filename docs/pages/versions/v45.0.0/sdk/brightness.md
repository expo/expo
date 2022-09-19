---
title: Brightness
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-brightness'
packageName: 'expo-brightness'
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';
import { AndroidPermissions } from '~/components/plugins/permissions';
import { ConfigClassic, ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

An API to get and set screen brightness.

On Android, there is a global system-wide brightness setting, and each app has its own brightness setting that can optionally override the global setting. It is possible to set either of these values with this API. On iOS, the system brightness setting cannot be changed programmatically; instead, any changes to the screen brightness will persist until the device is locked or powered off.

<PlatformsSection android emulator ios simulator />

## Installation

<APIInstallSection />

## Configuration in app.json / app.config.js

You can configure `expo-brightness` using its built-in [config plugin](../../../guides/config-plugins.md) if you use config plugins in your project ([EAS Build](../../../build/introduction.md) or `expo run:[android|ios]`).

<ConfigClassic>

Add the [`WRITE_SETTINGS`](#permissions) permissions to the [`permissions`](../config/app.md#permissions) list in the app manifest.

</ConfigClassic>

<ConfigReactNative>

Learn how to configure the native projects in the [installation instructions in the `expo-brightness` repository](https://github.com/expo/expo/tree/main/packages/expo-brightness#installation-in-bare-react-native-projects).

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "plugins": [
      "expo-brightness"
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[]} />

## Permissions

### Android

- On Android, the module requires permission to change the system-wide brightness. You can omit this permission if you are not using the `setSystemBrightness*` methods.

<AndroidPermissions permissions={['WRITE_SETTINGS']} />

### iOS

_No usage description required._

## Usage

<SnackInline label='Basic Brightness Usage' dependencies={['expo-brightness']}>

```jsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Brightness from 'expo-brightness';

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status === 'granted') {
        Brightness.setSystemBrightnessAsync(1);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Brightness Module Example</Text>
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
import * as Brightness from 'expo-brightness';
```

<APISection packageName="expo-brightness" apiName="Brightness" />

## Error Codes

### `ERR_BRIGHTNESS`

An error occurred when getting or setting the app brightness.

### `ERR_BRIGHTNESS_MODE`

An error occurred when getting or setting the system brightness mode. See the `nativeError` property of the thrown error for more information.

### `ERR_BRIGHTNESS_PERMISSIONS_DENIED`

An attempt to set the system brightness was made without the proper permissions from the user. The user did not grant `SYSTEM_BRIGHTNESS` permissions.

### `ERR_BRIGHTNESS_SYSTEM`

An error occurred when getting or setting the system brightness.

### `ERR_INVALID_ARGUMENT`

An invalid argument was passed. Only `BrightnessMode.MANUAL` or `BrightnessMode.AUTOMATIC` are allowed.
