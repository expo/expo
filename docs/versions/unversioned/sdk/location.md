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

### `Expo.Location.getProviderStatusAsync()`

Check status of location providers.

#### Returns

Returns an object with the following fields:

-   **locationServicesEnabled (_boolean_)** -- Whether location services are enabled.
-   **gpsAvailable (_boolean_)** (android only) -- If the GPS provider is available, if yes, location data will be from GPS.
-   **networkAvailable (_boolean_)** (android only) -- If the network provider is available, if yes, location data will be from cellular network.
-   **passiveAvailable (_boolean_)** (android only) -- If the passive provider is available, if yes, location data will be determined passively.

### `Expo.Location.getHeadingAsync()`

Gets the current heading information from the device

#### Arguments

None

#### Returns

Object with:

- **magHeading (_number_)** — measure of magnetic north in degrees
- **trueHeading (_number_)** — measure of true north in degrees (needs location permissions, will return -1 if not given)
- **accuracy (_number_)** — level of callibration of compass.
  - 3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: none
  - Reference for iOS: 3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees


### `Expo.Location.watchHeadingAsync(callback)`

Suscribe to compass updates from the device

#### Arguments

- **callback (_function_)** --

    This function is called on each compass update. It is passed exactly one parameter: an object with the following fields:

    - **magHeading (_number_)** — measure of magnetic north in degrees
    - **trueHeading (_number_)** — measure of true north in degrees (needs location permissions, will return -1 if not given)
    - **accuracy (_number_)** — level of callibration of compass.
    	- 3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: none
    	- Reference for iOS: 3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees

#### Returns

Returns a subscription object, which has one field:

- **remove (function)** — Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.

### `Expo.Location.geocodeAsync(address)`

Geocode an address string to latitiude-longitude location. _Notice_: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error so they have to be managed properly.

#### Arguments

- **address (_string_)** -- A string representing address, eg. "Baker Street London"

#### Returns

Returns an array (in most cases its size is 1) of geocoded location objects with the following fields:

-   **latitude (_number_)** -- The latitude in degrees.
-   **longitude (_number_)** -- The longitude in degrees.
-   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
-   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.
    
### `Expo.Location.reverseGeocodeAsync(location)`

Reverse geocode a location to postal address. _Notice_: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error so they have to be managed properly.

#### Arguments

-   **location (_object_)** -- An object representing a location:

    -   **latitude (_number_)** -- The latitude of location to reverse geocode, in degrees.
    -   **longitude (_number_)** -- The longitude of location to reverse geocode, in degrees.


#### Returns

Returns an array (in most cases its size is 1) of address objects with following fields:

-   **city (_string_)** -- City name of the address.
-   **street (_string_)** -- Street name of the address.
-   **region (_string_)** -- Region/area name of the address.
-   **postalCode (_string_)** -- Postal code of the address.
-   **country (_string_)** -- Localized country name of the address.
-   **name (_string_)** -- Place name of the address, for example, "Tower Bridge".

### `Expo.Location.setApiKey(apiKey)`

Sets a Google API Key for using Geocoding API. This method can be useful for Android devices that do not have Google Play Services, hence no Geocoder Service. After setting the key using Google's API will be possible.

#### Arguments

-   **apiKey (_string_)** -- API key collected from Google Developer site.