---
title: Segment
---

Provides access to <https://segment.com/> mobile analytics. Wraps Segment's [iOS](https://segment.com/docs/sources/mobile/ios/) and [Android](https://segment.com/docs/sources/mobile/android/) sources.

> **Note:** Session tracking may not work correctly when running Experiences in the main Expo app. It will work correctly if you create a standalone app.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-analytics-segment`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-analytics-segment).

## API

```js
import * as Segment from 'expo-analytics-segment';
```

### `Segment.initialize({ androidWriteKey, iosWriteKey })`

Segment requires separate write keys for iOS and Android. You will need to log in to Segment to recieve these <https://segment.com/docs/guides/setup/how-do-i-find-my-write-key/>

#### Arguments

Accepts an object with the following keys:

- **androidWriteKey (_string_)** – Write key for Android source.
- **iosWriteKey (_string_)** – Write key for iOS source.

### `Segment.identify(userId)`

Associates the current user with a user ID. Call this after calling [`Segment.initialize()`](#exposegmentinitialize 'Segment.initialize') but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

- **userId (_string_)** – User ID for the current user.

### `Segment.identifyWithTraits(userId, traits)`

#### Arguments

- **userId (_string_)** – User ID for the current user.
- **traits (_object_)** – A map of custom properties.

### `Segment.reset()`

Clears the current user. See <https://segment.com/docs/sources/mobile/ios/#reset>.

### `Segment.track(event)`

Log an event to Segment. See <https://segment.com/docs/spec/track/>.

#### Arguments

- **event (_string_)** – The event name.

### `Segment.trackWithProperties(event, properties)`

Log an event to Segment with custom properties. See <https://segment.com/docs/spec/track/>.

#### Arguments

- **event (_string_)** – The event name.
- **properties (_object_)** – A map of custom properties.

### `Segment.group(groupId)`

Associate the user with a group. See <https://segment.com/docs/spec/group/>.

#### Arguments

- **groupId (_string_)** – ID of the group.

### `Segment.groupWithTraits(groupId, traits)`

Associate the user with a group with traits. See <https://segment.com/docs/spec/group/>.

#### Arguments

- **groupId (_string_)** – ID of the group.
- **traits (_object_)** – free-form dictionary of traits of the group.

### `Segment.alias(newId, [options])`

Associate current identity with a new identifier. See <https://segment.com/docs/spec/alias/>.

#### Arguments

- **newId (_string_)** – Identifier to associate with.
- **options (_object_)** – _(optional)_ extra dictionary with options for the call. You could pass a dictionary of form `{ [integrationKey]: { enabled: boolean, options: object } }` to configure destinations of the call.

#### Returns

- A `Promise` resolving to a `boolean` indicating whether the method has been executed on the underlying Segment instance or not.

### `Segment.screen(screenName)`

Record that a user has seen a screen to Segment. See <https://segment.com/docs/spec/screen/>.

#### Arguments

- **screenName (_string_)** – Name of the screen.

### `Segment.screenWithProperties(screenName, properties)`

Record that a user has seen a screen to Segment with custom properties. See <https://segment.com/docs/spec/screen/>.

- **screenName (_string_)** – Name of the screen.
- **properties (_object_)** – A map of custom properties.

### `Segment.flush()`

Manually flush the event queue. You shouldn't need to call this in most cases.

### Opting out (enabling/disabling all tracking)

> Depending on the audience for your app (e.g. children) or the countries where you sell your app (e.g. the EU), you may need to offer the ability for users to opt-out of analytics data collection inside your app. You can turn off forwarding to ALL destinations including Segment itself:
> ([Source – Segment docs](https://segment.com/docs/sources/mobile/ios/#opt-out))

```js
import * as Segment from 'expo-analytics-segment';

Segment.setEnabledAsync(false);

// Or if they opt-back-in, you can re-enable data collection:
Segment.setEnabledAsync(true);
```

> **Note:** disabling the Segment SDK ensures that all data collection method invocations (eg. `track`, `identify`, etc) are ignored.

This method is only supported in standalone and detached apps. In Expo client the promise will reject.

The setting value will be persisted across restarts, so once you call `setEnabledAsync(false)`, Segment won't track the users even when the app restarts. To check whether tracking is enabled, use `Segment.getEnabledAsync()` which returns a promise which should resolve to a boolean.
