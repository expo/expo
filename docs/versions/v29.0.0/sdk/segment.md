---
title: Segment
---

Provides access to <https://segment.com/> mobile analytics. Wraps Segment's [iOS](https://segment.com/docs/sources/mobile/ios/) and [Android](https://segment.com/docs/sources/mobile/android/) sources.

> **Note:** Session tracking may not work correctly when running Experiences in the main Expo app. It will work correctly if you create a standalone app.

### `Expo.Segment.initialize({ androidWriteKey, iosWriteKey })`

Segment requires separate write keys for iOS and Android. You will need to log in to Segment to recieve these <https://segment.com/docs/guides/setup/how-do-i-find-my-write-key/>

#### Arguments

Accepts an object with the following keys:

-   **androidWriteKey (_string_)** -- Write key for Android source.
-   **iosWriteKey (_string_)** -- Write key for iOS source.

### `Expo.Segment.identify(userId)`

Associates the current user with a user ID. Call this after calling [`Expo.Segment.initialize()`](#exposegmentinitialize "Expo.Segment.initialize") but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

-   **userId (_string_)** -- User ID for the current user.

### `Expo.Segment.identifyWithTraits(userId, traits)`

Associates the current user with a user ID and some metadata. Call this after calling [`Expo.Segment.initialize()`](#exposegmentinitialize "Expo.Segment.initialize") but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

-   **userId (_string_)** -- User ID for the current user.
-   **traits (_object_)** -- A map of custom properties.

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

### `Expo.Segment.screenWithProperties(screenName, properties)`

Record that a user has seen a screen to Segment with custom properties. See <https://segment.com/docs/spec/screen/>.

-   **screenName (_string_)** -- Name of the screen.
-   **properties (_object_)** -- A map of custom properties.

### `Expo.Segment.flush()`

Manually flush the event queue. You shouldn't need to call this in most cases.
