---
title: Location
---

This module allows reading geolocation information from the device. Your app can poll for the current location or subscribe to location update events.

You must request permission to access the user's location before attempting to get it. To do this, you will want to use the [Permissions](permissions.html) API. You can see this in practice in the following example.

![sketch](H14SNiW3g)

### `Expo.Location.getCurrentPositionAsync(options)`

Get the current position of the device.

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **enableHighAccuracy (_boolean_)** -- Whether to enable high-accuracy mode. For low-accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **maximumAge (_number_)** -- (Android only). If specified, allow returning a previously cached position that is at most this old in milliseconds. If not specified, always gets a new location. On iOS this option is ignored and a new location is always returned.

#### Returns

Returns an object with the following fields:

-   **coords (_object_)** -- The coordinates of the position, with the following fields:
    -   **latitude (_number_)** -- The latitude in degrees.
    -   **longitude (_number_)** -- The longitude in degrees.
    -   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
    -   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.
    -   **altitudeAccuracy (_number_)** -- The accuracy of the altitude value, in meters (iOS only).
    -   **heading (_number_)** -- Horizontal direction of travel of this device, measured in degrees starting at due north and continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is 180 degrees, and so on.
    -   **speed (_number_)** -- The instantaneous speed of the device in meters per second.
-   **timestamp (_number_)** -- The time at which this position information was obtained, in milliseconds since epoch.

### `Expo.Location.watchPositionAsync(options, callback)`

Subscribe to location updates from the device.

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **enableHighAccuracy (_boolean_)** -- Whether to enable high accuracy mode. For low accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **timeInterval (_number_)** -- Minimum time to wait between each update in milliseconds.
    -   **distanceInterval (_number_)** -- Receive updates only when the location has changed by at least this distance in meters.

-   **callback (_function_)** --

      This function is called on each location update. It is passed exactly one parameter: an object with the following fields:

    -   **coords (_object_)** -- The coordinates of the position, with the following fields:
        -   **latitude (_number_)** -- The latitude in degrees.
        -   **longitude (_number_)** -- The longitude in degrees.
        -   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
        -   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.
        -   **altitudeAccuracy (_number_)** -- The accuracy of the altitude value, in meters (iOS only).
        -   **heading (_number_)** -- Horizontal direction of travel of this device, measured in degrees starting at due north and continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is 180 degrees, and so on.
        -   **speed (_number_)** -- The instantaneous speed of the device in meters per second.
    -   **timestamp (_number_)** -- The time at which this position information was obtained, in milliseconds since epoch.

#### Returns

Returns a subscription object, which has one field:

-   **remove (_function_)** -- Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.
