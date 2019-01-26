---
title: IntentLauncherAndroid
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Provides a way to launch android intents. e.g. - opening a specific settings screen.

## Usage

### `IntentLauncherAndroid.startActivityAsync(activity, data, uri, mime)`

Starts the specified activity. The method will return a promise which resolves when the user returns to the app.

#### Arguments

- **activity (`string`)** -- A string specifying which settings screen to open, or alternatively the action of the intent. There are a few pre-defined constants you can use for this parameter. You can find them at [expo/src/IntentLauncherAndroid.ts](https://github.com/expo/expo/blob/master/packages/expo/src/IntentLauncherAndroid/IntentLauncherAndroid.ts).

- **data (`{ [key: string]: any }`)** (Optional) -- A map specifying additional key-value pairs which are passed with the intent as `extras`.

- **uri (`string`)** (Optional) -- A URI specifying the data that the intent should operate upon. (_Note: Android requires the URI scheme to be lowercase, unlike the formal RFC._)

- **mime (`string`)** (Optional) -- A string specifying the MIME type of the data represented by the `uri` argument. Ignore this argument to allow Android to infer the correct MIME type.

#### Example

```javascript
import { IntentLauncherAndroid } from 'expo';

// Open location settings
IntentLauncherAndroid.startActivityAsync(
  IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
);
```
