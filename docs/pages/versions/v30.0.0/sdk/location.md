---
title: Location
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';
import SnackEmbed from '~/components/plugins/SnackEmbed';

export default withDocumentationElements(meta);

This module allows reading geolocation information from the device. Your app can poll for the current location or subscribe to location update events.

You must request permission to access the user's location before attempting to get it. To do this, you will want to use the [Permissions](../permissions/) API. You can see this in practice in the following example.

<SnackEmbed snackId="H14SNiW3g" />

### `Expo.Location.getCurrentPositionAsync(options)`

Get the current position of the device.

#### Arguments

-   **options : `object`** --

      A map of options:

    -   **enableHighAccuracy : `boolean`** -- Whether to enable high-accuracy mode. For low-accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **maximumAge : `number`** -- (Android only). If specified, allow returning a previously cached position that is at most this old in milliseconds. If not specified, always gets a new location. On iOS this option is ignored and a new location is always returned.

#### Returns

Returns a promise resolving to an object with the following fields:

-   **coords : `object`** -- The coordinates of the position, with the following fields:
    -   **latitude : `number`** -- The latitude in degrees.
    -   **longitude : `number`** -- The longitude in degrees.
    -   **altitude : `number`** -- The altitude in meters above the WGS 84 reference ellipsoid.
    -   **accuracy : `number`** -- The radius of uncertainty for the location, measured in meters.
    -   **altitudeAccuracy : `number`** -- The accuracy of the altitude value, in meters (iOS only).
    -   **heading : `number`** -- Horizontal direction of travel of this device, measured in degrees starting at due north and continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is 180 degrees, and so on.
    -   **speed : `number`** -- The instantaneous speed of the device in meters per second.
-   **timestamp : `number`** -- The time at which this position information was obtained, in milliseconds since epoch.

### `Expo.Location.watchPositionAsync(options, callback)`

Subscribe to location updates from the device. Please note that updates will only occur while the application is in the foreground. Background location tracking is [planned](https://expo.canny.io/feature-requests/p/background-location-tracking), but not yet implemented.

#### Arguments

-   **options : `object`** --

      A map of options:

    -   **enableHighAccuracy : `boolean`** -- Whether to enable high accuracy mode. For low accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **timeInterval : `number`** -- Minimum time to wait between each update in milliseconds.
    -   **distanceInterval : `number`** -- Receive updates only when the location has changed by at least this distance in meters.

-   **callback : `function`** --

      This function is called on each location update. It is passed exactly one parameter: an object with the following fields:

    -   **coords : `object`** -- The coordinates of the position, with the following fields:
        -   **latitude : `number`** -- The latitude in degrees.
        -   **longitude : `number`** -- The longitude in degrees.
        -   **altitude : `number`** -- The altitude in meters above the WGS 84 reference ellipsoid.
        -   **accuracy : `number`** -- The radius of uncertainty for the location, measured in meters.
        -   **altitudeAccuracy : `number`** -- The accuracy of the altitude value, in meters (iOS only).
        -   **heading : `number`** -- Horizontal direction of travel of this device, measured in degrees starting at due north and continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is 180 degrees, and so on.
        -   **speed : `number`** -- The instantaneous speed of the device in meters per second.
    -   **timestamp : `number`** -- The time at which this position information was obtained, in milliseconds since epoch.

#### Returns

Returns a promise resolving to a subscription object, which has one field:

-   **remove : `function`** -- Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.

### `Expo.Location.getProviderStatusAsync()`

Check status of location providers.

#### Returns

Returns a promise resolving to an object with the following fields:

-   **locationServicesEnabled : `boolean`** -- Whether location services are enabled.
-   **gpsAvailable : `boolean`** (android only) -- If the GPS provider is available, if yes, location data will be from GPS.
-   **networkAvailable : `boolean`** (android only) -- If the network provider is available, if yes, location data will be from cellular network.
-   **passiveAvailable : `boolean`** (android only) -- If the passive provider is available, if yes, location data will be determined passively.

### `Expo.Location.getHeadingAsync()`

Gets the current heading information from the device

#### Returns

Object with:

- **magHeading : `number`** — measure of magnetic north in degrees
- **trueHeading : `number`** — measure of true north in degrees (needs location permissions, will return -1 if not given)
- **accuracy : `number`** — level of callibration of compass.
  - 3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: none
  - Reference for iOS: 3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees


### `Expo.Location.watchHeadingAsync(callback)`

Suscribe to compass updates from the device

#### Arguments

- **callback : `function`** --

    This function is called on each compass update. It is passed exactly one parameter: an object with the following fields:

    - **magHeading : `number`** — measure of magnetic north in degrees
    - **trueHeading : `number`** — measure of true north in degrees (needs location permissions, will return -1 if not given)
    - **accuracy : `number`** — level of callibration of compass.
    	- 3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: none
    	- Reference for iOS: 3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees

#### Returns

Returns a promise resolving to a subscription object, which has one field:

- **remove (function)** — Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.

### `Expo.Location.geocodeAsync(address)`

Geocode an address string to latitiude-longitude location.

> **Note**: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error so they have to be managed properly.
>
> On Android, you must request a location permission (`Expo.Permissions.LOCATION`) from the user before geocoding can be used.

#### Arguments

- **address : `string`** -- A string representing address, eg. "Baker Street London"

#### Returns

Returns a promise resolving to an array (in most cases its size is 1) of geocoded location objects with the following fields:

-   **latitude : `number`** -- The latitude in degrees.
-   **longitude : `number`** -- The longitude in degrees.
-   **altitude : `number`** -- The altitude in meters above the WGS 84 reference ellipsoid.
-   **accuracy : `number`** -- The radius of uncertainty for the location, measured in meters.

### `Expo.Location.reverseGeocodeAsync(location)`

Reverse geocode a location to postal address.

> **Note**: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error so they have to be managed properly.

> On Android, you must request a location permission (`Expo.Permissions.LOCATION`) from the user before geocoding can be used.

#### Arguments

-   **location : `object`** -- An object representing a location:

    -   **latitude : `number`** -- The latitude of location to reverse geocode, in degrees.
    -   **longitude : `number`** -- The longitude of location to reverse geocode, in degrees.


#### Returns

Returns a promise resolving to an array (in most cases its size is 1) of address objects with following fields:

-   **city : `string`** -- City name of the address.
-   **street : `string`** -- Street name of the address.
-   **region : `string`** -- Region/area name of the address.
-   **postalCode : `string`** -- Postal code of the address.
-   **country : `string`** -- Localized country name of the address.
-   **name : `string`** -- Place name of the address, for example, "Tower Bridge".

### `Expo.Location.setApiKey(apiKey)`

Sets a Google API Key for using Geocoding API. This method can be useful for Android devices that do not have Google Play Services, hence no Geocoder Service. After setting the key using Google's API will be possible.

#### Arguments

-   **apiKey : `string`** -- API key collected from Google Developer site.
