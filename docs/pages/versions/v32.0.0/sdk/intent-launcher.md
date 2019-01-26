---
title: IntentLauncherAndroid
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Provides a way to launch android intents. e.g. - opening a specific settings screen.

## Usage

### `Expo.IntentLauncherAndroid.startActivityAsync(activity, data)`

Starts the specified activity. The optional `data` parameter can be specified to pass additional data object to the activity. The method will return a promise which resolves when the user returns to the app.

There are a few pre-defined constants you can use for the `activity` parameter. You can find them at [expo/expo-sdk/src/IntentLauncherAndroid.js](https://github.com/expo/expo-sdk/blob/master/src/IntentLauncherAndroid.js).

#### Example

```javascript
import { IntentLauncherAndroid } from 'expo';

// Open location settings
IntentLauncherAndroid.startActivityAsync(
  IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
);
```
