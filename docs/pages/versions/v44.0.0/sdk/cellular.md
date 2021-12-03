---
title: Cellular
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-cellular'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-cellular`** provides information about the user’s cellular service provider, such as its unique identifier, cellular connection type, and whether it allows VoIP calls on its network.

<PlatformsSection android emulator ios web />

## Installation

<InstallSection packageName="expo-cellular" />

## API

```js
import * as Cellular from 'expo-cellular';
```

<APISection packageName="expo-cellular" apiName="Cellular" />

## Error Codes

| Code                                         | Description                                                          |
| -------------------------------------------- | -------------------------------------------------------------------- |
| ERR_CELLULAR_GENERATION_UNKNOWN_NETWORK_TYPE | Unable to access network type or not connected to a cellular network |
