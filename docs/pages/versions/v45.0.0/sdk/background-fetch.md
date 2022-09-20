---
title: BackgroundFetch
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-background-fetch'
packageName: 'expo-background-fetch'
---

import APISection from '~/components/plugins/APISection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';
import ImageSpotlight from '~/components/plugins/ImageSpotlight'

**`expo-background-fetch`** provides an API to perform [background fetch](https://developer.apple.com/documentation/uikit/core_app/managing_your_app_s_life_cycle/preparing_your_app_to_run_in_the_background/updating_your_app_with_background_app_refresh) tasks, allowing you to run specific code periodically in the background to update your app. This module uses [TaskManager](task-manager.md) Native API under the hood.

<PlatformsSection android emulator ios simulator />

## Known issues

**iOS only**: BackgroundFetch only works when the app is backgrounded, not if the app was terminated or upon device reboot. [Here is the relevant GitHub issue](https://github.com/expo/expo/issues/3582)

## Installation

For [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps, you'll need to run `expo install expo-background-fetch`. To use it in [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/main/packages/expo-background-fetch);

## Usage

Below is an example that demonstrates how to use `expo-background-fetch`.

<SnackInline label="Background Fetch Usage" dependencies={['expo-background-fetch', 'expo-task-manager']}>

```tsx
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch';

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now();

  console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

export default function BackgroundFetchScreen() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    checkStatusAsync();
  }, []);

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    setStatus(status);
    setIsRegistered(isRegistered);
  };

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background fetch status:{' '}
          <Text style={styles.boldText}>
            {status && BackgroundFetch.BackgroundFetchStatus[status]}
          </Text>
        </Text>
        <Text>
          Background fetch task name:{' '}
          <Text style={styles.boldText}>
            {isRegistered ? BACKGROUND_FETCH_TASK : 'Not registered yet!'}
          </Text>
        </Text>
      </View>
      <View style={styles.textContainer}></View>
      <Button
        title={isRegistered ? 'Unregister BackgroundFetch task' : 'Register BackgroundFetch task'}
        onPress={toggleFetchTask}
      />
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
});
/* @end */
```

</SnackInline>

## Triggering background fetches

Background fetches can be difficult to test because they can happen inconsistently. Fortunately, you can trigger background fetches manually when developing your apps.

For iOS, you can use the `Instruments` app on macOS to manually trigger background fetches:

1. Open the Instruments app. The Instruments app can be searched through Spotlight (⌘ + Space) or opened from `/Applications/Xcode.app/Contents/Applications/Instruments.app`
2. Select `Time Profiler`
3. Select your device / simulator and pick the `Expo Go` app
4. Press the `Record` button in the top left corner
5. Navigate to the `Document` Menu and select `Simulate Background Fetch - Expo Go`:

<ImageSpotlight alt="Xcode Menu with Simulate Background Fetch option" src="/static/images/simulate-background-fetch-instruments.png" />

For Android, you can set the `minimumInterval` option of your task to a small number and background your application like so:

```tsx
async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 1, // task will fire 1 minute after app is backgrounded
  });
}
```

## Configuration

In order to use `BackgroundFetch` API in standalone, detached and bare apps on iOS, your app has to include background mode in the **Info.plist** file. See [background tasks configuration guide](task-manager.md#configuration-for-standalone-apps) for more details.

On Android, this module might listen when the device is starting up. It's necessary to continue working on tasks started with `startOnBoot`. It also keeps devices "awake" that are going idle and asleep fast, to improve reliability of the tasks. Because of this both the `RECEIVE_BOOT_COMPLETED` and `WAKE_LOCK` permissions are added automatically.

## API

```js
import * as BackgroundFetch from 'expo-background-fetch';
```

<APISection packageName="expo-background-fetch" apiName="BackgroundFetch" />
