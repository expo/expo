---
title: Cellular
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-cellular'
packageName: 'expo-cellular'
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';
import { AndroidPermissions } from '~/components/plugins/permissions';
import { ConfigClassic, ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-cellular`** provides information about the user’s cellular service provider, such as its unique identifier, cellular connection type, and whether it allows VoIP calls on its network.

<PlatformsSection android emulator ios web />

## Installation

<APIInstallSection />

## Configuration in app.json / app.config.js

You can configure `expo-cellular` using its built-in [config plugin](../../../guides/config-plugins.md) if you use config plugins in your project ([EAS Build](../../../build/introduction.md) or `expo run:[android|ios]`).

<ConfigClassic>

Add the [`READ_PHONE_STATE`](#permissions) permissions to the [`permissions`](../config/app.md#permissions) list in the app manifest.

</ConfigClassic>

<ConfigReactNative>

Learn how to configure the native projects in the [installation instructions in the `expo-cellular` repository](https://github.com/expo/expo/tree/main/packages/expo-cellular#installation-in-bare-react-native-projects).

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "plugins": [
      "expo-cellular"
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[]} />

## Permissions

### Android

<AndroidPermissions permissions={['READ_PHONE_STATE']} />

### iOS

_No usage description required._

## API

```js
import * as Cellular from 'expo-cellular';
```

<APISection packageName="expo-cellular" apiName="Cellular" />

## Error Codes

| Code                                         | Description                                                          |
| -------------------------------------------- | -------------------------------------------------------------------- |
| ERR_CELLULAR_GENERATION_UNKNOWN_NETWORK_TYPE | Unable to access network type or not connected to a cellular network |
