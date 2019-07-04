---
title: Amplitude
---

Provides access to [Amplitude](https://amplitude.com/) mobile analytics which basically lets you log various events to the Cloud. This module wraps Amplitude's [iOS](https://github.com/amplitude/Amplitude-iOS) and [Android](https://github.com/amplitude/Amplitude-Android) SDKs. For a great example of usage, see the [Expo app source code](https://github.com/expo/expo/blob/master/home/api/Analytics.ts).

Note: Session tracking may not work correctly when running Experiences in the main Expo app. It will work correctly if you create a standalone app.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-analytics-amplitude`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-analytics-amplitude).

## API

```js
import * as Amplitude from 'expo-analytics-amplitude';
```

### `Amplitude.initialize(apiKey)`

Initializes Amplitude with your Amplitude API key. If you're having trouble finding your API key, see [step 4 of these instructions](https://amplitude.zendesk.com/hc/en-us/articles/207108137-Introduction-Getting-Started#getting-started).

#### Arguments

- **apiKey (_string_)** -- Your Amplitude application's API key.

### `Amplitude.setUserId(userId)`

Assign a user ID to the current user. If you don't have a system for user IDs you don't need to call this. See [this page](https://amplitude.zendesk.com/hc/en-us/articles/206404628-Step-2-Assign-User-IDs-and-Identify-your-Users) for details.

#### Arguments

- **userId (_string_)** -- User ID for the current user.

### `Amplitude.setUserProperties(userProperties)`

Set properties for the current user. See [here for details](https://amplitude.zendesk.com/hc/en-us/articles/207108327-Step-4-Set-User-Properties-and-Event-Properties).

#### Arguments

- **userProperties (_object_)** -- A map of custom properties.

### `Amplitude.clearUserProperties()`

Clear properties set by [`Amplitude.setUserProperties()`](#expoamplitudesetuserproperties 'Amplitude.setUserProperties').

### `Amplitude.logEvent(eventName)`

Log an event to Amplitude. For more information about what kind of events to track, [see here](https://amplitude.zendesk.com/hc/en-us/articles/206404698-Step-3-Track-Events-and-Understand-the-Actions-Users-Take).

#### Arguments

- **eventName (_string_)** -- The event name.

### `Amplitude.logEventWithProperties(eventName, properties)`

Log an event to Amplitude with custom properties. For more information about what kind of events to track, [see here](https://amplitude.zendesk.com/hc/en-us/articles/206404698-Step-3-Track-Events-and-Understand-the-Actions-Users-Take).

#### Arguments

- **eventName (_string_)** -- The event name.
- **properties (_object_)** -- A map of custom properties.

### `Amplitude.setGroup(groupType, groupNames)`

Add the current user to a group. For more information, see here for [iOS](https://github.com/amplitude/Amplitude-iOS#setting-groups) and see here for [Android](https://github.com/amplitude/Amplitude-Android#setting-groups).

#### Arguments

- **groupType (_string_)** -- The group name, e.g. "sports".
- **groupNames (_object_)** -- An array of group names, e.g. \["tennis", "soccer"]. Note: the iOS and Android Amplitude SDKs allow you to use a string or an array of strings. We only support an array of strings. Just use an array with one element if you only want one group name.
