---
title: Segment
old_permalink: /versions/v12.0.0/sdk/segment.html
previous___FILE: ./permissions.md
next___FILE: ./svg.md
---

Provides access to <https://segment.com/> mobile analytics. Wraps Segment's [iOS](https://segment.com/docs/sources/mobile/ios/) and [Android](https://segment.com/docs/sources/mobile/android/) sources.

Note: Session tracking may not work correctly when running Experiences in the main Exponent app. It will work correctly if you create a standalone app.

### `Exponent.Segment.initializeIOS(writeKey)`

Segment requires separate write keys for iOS and Android. Call this with the write key for your iOS source in Segment.

#### Arguments

-   **writeKey (_string_)** -- Write key for iOS source.

### `Exponent.Segment.initializeAndroid(writeKey)`

Segment requires separate write keys for iOS and Android. Call this with the write key for your Android source in Segment.

#### Arguments

-   **writeKey (_string_)** -- Write key for Android source.

### `Exponent.Segment.identify(userId)`

Associates the current user with a user ID. Call this after calling [`Exponent.Segment.initializeIOS()`](#Exponent.Segment.initializeIOS "Exponent.Segment.initializeIOS") and [`Exponent.Segment.initializeAndroid()`](#Exponent.Segment.initializeAndroid "Exponent.Segment.initializeAndroid") but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

-   **writeKey (_string_)** -- User ID for the current user.

### `Exponent.Segment.identifyWithTraits(userId, traits)`

Associates the current user with a user ID and some metadata. Call this after calling [`Exponent.Segment.initializeIOS()`](#Exponent.Segment.initializeIOS "Exponent.Segment.initializeIOS") and [`Exponent.Segment.initializeAndroid()`](#Exponent.Segment.initializeAndroid "Exponent.Segment.initializeAndroid") but before other segment calls. See <https://segment.com/docs/spec/identify/>.

#### Arguments

-   **writeKey (_string_)** -- User ID for the current user.

#### :param object traits

A map of custom properties.

### `Exponent.Segment.track(event)`

Log an event to Segment. See <https://segment.com/docs/spec/track/>.

#### Arguments

-   **event (_string_)** -- The event name.

### `Exponent.Segment.trackWithProperties(event, properties)`

Log an event to Segment with custom properties. See <https://segment.com/docs/spec/track/>.

#### Arguments

-   **event (_string_)** -- The event name.
-   **properties (_object_)** -- A map of custom properties.

### `Exponent.Segment.flush()`

Manually flush the event queue. You shouldn't need to call this in most cases.
