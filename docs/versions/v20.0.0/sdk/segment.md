---
title: Segment
---

Provides access to <https://segment.com/> mobile analytics. Wraps Segment's [iOS](https://segment.com/docs/sources/mobile/ios/) and [Android](https://segment.com/docs/sources/mobile/android/) sources.

> **Note:** Session tracking may not work correctly when running Experiences in the main Expo app. It will work correctly if you create a standalone app.

### `Expo.Segment.initializeIOS(writeKey)`

Segment requires separate write keys for iOS and Android. Call this with the write key for your iOS source in Segment.

#### Arguments

-   **writeKey (_string_)** -- Write key for iOS source.

### `Expo.Segment.initializeAndroid(writeKey)`

Segment requires separate write keys for iOS and Android. Call this with the write key for your Android source in Segment.

#### Arguments

-   **writeKey (_string_)** -- Write key for Android source.

### `Expo.Segment.identify(userId)`

Associates the current user with a user ID. Call this after calling [`Expo.Segment.initializeIOS()`](#exposegmentinitializeios "Expo.Segment.initializeIOS") and [`Expo.Segment.initializeAndroid()`](#exposegmentinitializeandroid "Expo.Segment.initializeAndroid") but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

-   **writeKey (_string_)** -- User ID for the current user.

### `Expo.Segment.identifyWithTraits(userId, traits)`

Associates the current user with a user ID and some metadata. Call this after calling [`Expo.Segment.initializeIOS()`](#exposegmentinitializeios "Expo.Segment.initializeIOS") and [`Expo.Segment.initializeAndroid()`](#exposegmentinitializeandroid "Expo.Segment.initializeAndroid") but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

-   **writeKey (_string_)** -- User ID for the current user.

#### :param object traits

A map of custom properties.

### `Expo.Segment.reset()`

Clears the current user. See <https://segment.com/docs/sources/mobile/ios/#reset>.

### `Expo.Segment.track(event)`

Log an event to Segment. See <https://segment.com/docs/spec/track/>.

#### Arguments

-   **event (_string_)** -- The event name.

### `Expo.Segment.trackWithProperties(event, properties)`

Log an event to Segment with custom properties. See <https://segment.com/docs/spec/track/>.

#### Arguments

-   **event (_string_)** -- The event name.
-   **properties (_object_)** -- A map of custom properties.

### `Expo.Segment.screen(screenName)`

Record that a user has seen a screen to Segment. See <https://segment.com/docs/spec/screen/>.

#### Arguments

-   **screenName (_string_)** -- Name of the screen.

### `Expo.Segment.screenWithProperties(event, properties)`

Record that a user has seen a screen to Segment with custom properties. See <https://segment.com/docs/spec/screen/>.

-   **screenName (_string_)** -- Name of the screen.
-   **properties (_object_)** -- A map of custom properties.

### `Expo.Segment.flush()`

Manually flush the event queue. You shouldn't need to call this in most cases.
