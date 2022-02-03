---
title: IntentLauncher
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-intent-launcher'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-intent-launcher`** provides a way to launch Android intents. For example, you can use this API to open a specific settings screen.

<PlatformsSection android emulator />

## Installation

<InstallSection packageName="expo-intent-launcher" />

#### Example

```ts
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';

// Open location settings
startActivityAsync(ActivityAction.LOCATION_SOURCE_SETTINGS);
```

## API

```js
import * as IntentLauncher from 'expo-intent-launcher';
```

<APISection packageName="expo-intent-launcher" apiName="IntentLauncher" />
