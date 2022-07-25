---
title: TaskManager
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-task-manager'
packageName: 'expo-task-manager'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import APISection from '~/components/plugins/APISection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-task-manager`** provides an API that allows you to manage long-running tasks, in particular those tasks that can run while your app is in the background.
Some features of this module are used by other modules under the hood. Here is a list of Expo modules that use TaskManager:

- [Location](location.md)
- [BackgroundFetch](background-fetch.md)

<PlatformsSection android emulator ios simulator />

## Installation

<APIInstallSection />

## Configuration for standalone apps

### Background modes on iOS

`TaskManager` works out of the box in the Expo Go app on Android, but on iOS you'll need to test using [a development build](/development/introduction.md)

Standalone apps need some extra configuration: on iOS, each background feature requires a special key in `UIBackgroundModes` array in your **Info.plist** file. In standalone apps this array is empty by default, so in order to use background features you will need to add appropriate keys to your **app.json** configuration.
Here is an example of an **app.json** configuration that enables background location and background fetch:

```json
{
  "expo": {
    ...
    "ios": {
      ...
      "infoPlist": {
        ...
        "UIBackgroundModes": [
          "location",
          "fetch"
        ]
      }
    }
  }
}
```

For bare React Native apps, you need to add those keys manually. You can do it by clicking on your project in Xcode, then `Signing & Capabilities`, adding the `BackgroundMode` capability (if absent), and checking either `Location updates` or `Background fetch`, depending on your needs.

## Example

<SnackInline dependencies={["expo-task-manager", "expo-location"]}>

```javascript
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

const requestPermissions = async () => {
  const { status } = await Location.requestPermissionsAsync();
  if (status === 'granted') {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
    });
  }
};

const PermissionsButton = () => (
  <TouchableOpacity onPress={requestPermissions}>
    <Text>Enable background location</Text>
  </TouchableOpacity>
);

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    return;
  }
  if (data) {
    const { locations } = data;
    // do something with the locations captured in the background
  }
});

export default PermissionsButton;
```

</SnackInline>

## API

```js
import * as TaskManager from 'expo-task-manager';
```

<APISection packageName="expo-task-manager" apiName="TaskManager" />