---
title: Location
---

This module allows reading geolocation information from the device. Your app can poll for the current location or subscribe to location update events.

You must request permission to access the user's location before attempting to get it. To do this, you will want to use the [Permissions](permissions.html) API. You can see this in practice in the following example.

${<SnackEmbed snackId="H14SNiW3g" />}

### `Expo.Location.hasServicesEnabledAsync()`

Checks whether location services are enabled by the user.

#### Returns

Returns a promise resolving to `true` if location services are enabled on the device, or `false` if not.

### `Expo.Location.requestPermissionsAsync()`

Requests the user for location permissions, similarly to `Permissions.askAsync(Permissions.LOCATION)`.

#### Returns

Returns a promise that resolves when the permissions are granted and rejects when denied.

### `Expo.Location.getCurrentPositionAsync(options)`

Get the current position of the device.

#### Arguments

-   **options (_object_)** -- A map of options:
    -   **accuracy (_[Location.Accuracy](#expolocationaccuracy)_)** -- Location manager accuracy. Pass one of [Location.Accuracy](#expolocationaccuracy) enum values. For low-accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **maximumAge (_number_)** -- (Android only). If specified, allow returning a previously cached position that is at most this old in milliseconds. If not specified, always gets a new location. On iOS this option is ignored and a new location is always returned.

#### Returns

Returns a promise resolving to an object representing [Location](#typelocation) type.

### `Expo.Location.watchPositionAsync(options, callback)`

Subscribe to location updates from the device. Please note that updates will only occur while the application is in the foreground. To get location updates while in background you'll need to use [`Location.startLocationUpdatesAsync`](#expolocationstartlocationupdatesasync).

#### Arguments

-   **options (_object_)** -- A map of options:
    -   **accuracy (_[Location.Accuracy](#expolocationaccuracy)_** -- Location manager accuracy. Pass one of [Location.Accuracy](#expolocationaccuracy) enum values. For low accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **timeInterval (_number_)** -- Minimum time to wait between each update in milliseconds.
    -   **distanceInterval (_number_)** -- Receive updates only when the location has changed by at least this distance in meters.

-   **callback (_function_)** --

      This function is called on each location update. It is passed exactly one parameter: an object representing [Location](#typelocation) type.

#### Returns

Returns a promise resolving to a subscription object, which has one field:

-   **remove (_function_)** -- Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.

### `Expo.Location.getProviderStatusAsync()`

Check status of location providers.

#### Returns

Returns a promise resolving to an object with the following fields:

-   **locationServicesEnabled (_boolean_)** -- Whether location services are enabled. See [Location.hasServicesEnabledAsync](#expolocationhasservicesenabledasync) for a more convenient solution to get this value.
-   **gpsAvailable (_boolean_)** (android only) -- If the GPS provider is available, if yes, location data will be from GPS.
-   **networkAvailable (_boolean_)** (android only) -- If the network provider is available, if yes, location data will be from cellular network.
-   **passiveAvailable (_boolean_)** (android only) -- If the passive provider is available, if yes, location data will be determined passively.

### `Expo.Location.getHeadingAsync()`

Gets the current heading information from the device

#### Returns

Object with:

- **magHeading (_number_)** — measure of magnetic north in degrees
- **trueHeading (_number_)** — measure of true north in degrees (needs location permissions, will return -1 if not given)
- **accuracy (_number_)** — level of callibration of compass.
  - 3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: none
  - Reference for iOS: 3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees


### `Expo.Location.watchHeadingAsync(callback)`

Subscribe to compass updates from the device.

#### Arguments

- **callback (_function_)** --

    This function is called on each compass update. It is passed exactly one parameter: an object with the following fields:

    - **magHeading (_number_)** — measure of magnetic north in degrees
    - **trueHeading (_number_)** — measure of true north in degrees (needs location permissions, will return -1 if not given)
    - **accuracy (_number_)** — level of callibration of compass.
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

- **address (_string_)** -- A string representing address, eg. "Baker Street London"

#### Returns

Returns a promise resolving to an array (in most cases its size is 1) of geocoded location objects with the following fields:

-   **latitude (_number_)** -- The latitude in degrees.
-   **longitude (_number_)** -- The longitude in degrees.
-   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
-   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.

### `Expo.Location.reverseGeocodeAsync(location)`

Reverse geocode a location to postal address.

> **Note**: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error so they have to be managed properly.

> On Android, you must request a location permission (`Expo.Permissions.LOCATION`) from the user before geocoding can be used.

#### Arguments

-   **location (_object_)** -- An object representing a location:

    -   **latitude (_number_)** -- The latitude of location to reverse geocode, in degrees.
    -   **longitude (_number_)** -- The longitude of location to reverse geocode, in degrees.


#### Returns

Returns a promise resolving to an array (in most cases its size is 1) of address objects with following fields:

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

### `Expo.Location.installWebGeolocationPolyfill()`

Polyfills `navigator.geolocation` for interop with the core React Native and Web API approach to geolocation.

## Background Location

Background Location API can notify your app about new locations, also while it's in background. There are some requirements in order to use Background Location API:

- `Permissions.LOCATION` permission must be granted. On iOS it must be granted with `Always` option — see [`Permissions.LOCATION`](./permissions.md#expopermissionslocation) for more details.
- `"location"` background mode must be specified in `Info.plist` file. See [background tasks configuration guide](./task-manager.md#configuration). (*iOS only*)
- Background location task must be defined in the top-level scope, using [TaskManager.defineTask](./task-manager.md#taskmanagerdefinetasktaskname-task).

### `Expo.Location.startLocationUpdatesAsync(taskName, options)`

Registers for receiving location updates that can also come when the app is in the background.

#### Arguments

-   **taskName (_string_)** -- Name of the task receiving location updates.
-   **options (_object_)** -- An object of options passed to the location manager.
    -   **accuracy (_[Location.Accuracy](#expolocationaccuracy)_)** -- Location manager accuracy. Pass one of [Location.Accuracy](#expolocationaccuracy) enum values. For low-accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **timeInterval (_number_)** -- Minimum time to wait between each update in milliseconds. Default value depends on `accuracy` option. (**Android only**)
    -   **distanceInterval (_number_)** -- Receive updates only when the location has changed by at least this distance in meters. Default value depends on `accuracy` option. (**Android only**)
    -   **showsBackgroundLocationIndicator (_boolean_)** -- A boolean indicating whether the status bar changes its appearance when location services are used in the background. Defaults to `false`. (**Takes effect only on iOS 11.0 and later**)

#### Returns

A promise resolving once the task with location updates is registered.

#### Task parameters

Background location task will be receiving following data:

-   **locations (_Array&lt;[Location](#typelocation)&gt;_)** - An array of the new locations.

```javascript
import { TaskManager } from 'expo';

TaskManager.defineTask(YOUR_TASK_NAME, ({ data: { locations }, error }) => {
  if (!error) {
    // check `error.message` for more details.
    return;
  }
  console.log('Received new locations', locations);
});
```

### `Expo.Location.stopLocationUpdatesAsync(taskName)`

Stops location updates for given task.

#### Arguments

-   **taskName (_string_)** -- Name of the background location task to stop.

#### Returns

A promise resolving as soon as the task is unregistered.

## Geofencing

Geofencing API notifies your app when the device enters or leaves geographical regions you set up.
To make it work in the background, it uses [TaskManager](./task-manager.md) Native API under the hood. There are some requirements in order to use Geofencing API:

- `Permissions.LOCATION` permission must be granted. On iOS it must be granted with `Always` option — see [`Permissions.LOCATION`](./permissions.md#expopermissionslocation) for more details.
- `"location"` background mode must be specified in `Info.plist` file. See [background tasks configuration guide](./task-manager.md#configuration). (*iOS only*)
- Geofencing task must be defined in the top-level scope, using [`TaskManager.defineTask`](./task-manager.md#taskmanagerdefinetasktaskname-task).

### `Expo.Location.startGeofencingAsync(taskName, regions)`

Starts geofencing for given regions. When the new event comes, the task with specified name will be called with the region that the device enter to or exit from.
If you want to add or remove regions from already running geofencing task, you can just call `startGeofencingAsync` again with the new array of regions.

#### Arguments

-   **taskName (_string_)** -- Name of the task that will be called when the device enters or exits from specified regions.
-   **regions (_array_)** -- Array of region objects to be geofenced.
    -   **identifier (_string_)** -- The identifier of the region object. Defaults to auto-generated UUID hash.
    -   **latitude (_number_)** -- The latitude in degrees of region's center point. *required*
    -   **longitude (_number_)** -- The longitude in degrees of region's center point. *required*
    -   **radius (_number_)** -- The radius measured in meters that defines the region's outer boundary. *required*
    -   **notifyOnEnter (_boolean_)** -- Boolean value whether to call the task if the device enters the region. Defaults to `true`.
    -   **notifyOnExit (_boolean_)** -- Boolean value whether to call the task if the device exits the region. Defaults to `true`.

#### Returns

A promise resolving as soon as the task is registered.

#### Task parameters

Geofencing task will be receiving following data:
-   **eventType (_[Location.GeofencingEventType](#expolocationgeofencingeventtype)_)** -- Indicates the reason for calling the task, which can be triggered by entering or exiting the region. See [Location.GeofencingEventType](#expolocationgeofencingeventtype).
-   **region (_[Region](#typeregion)_)** -- Object containing details about updated region. See [Region](#typeregion) for more details.

```javascript
import { Location, TaskManager } from 'expo';

TaskManager.defineTask(YOUR_TASK_NAME, ({ data: { eventType, region }, error }) => {
  if (!error) {
    // check `error.message` for more details.
    return;
  }
  if (eventType === Location.GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
  } else if (eventType === Location.GeofencingEventType.Exit) {
    console.log("You've left region:", region);
  }
});
```

### `Expo.Location.stopGeofencingAsync(taskName)`

Stops geofencing for specified task. It unregisters the background task so the app will not be receiving any updates, especially in the background.

#### Arguments

-   **taskName (_string_)** -- Name of the task to unregister.

#### Returns

A promise resolving as soon as the task is unregistered.

## Types

### Type `Location`

Object of type `Location` contains following keys:

-   **coords (_object_)** -- The coordinates of the position, with the following fields:
    -   **latitude (_number_)** -- The latitude in degrees.
    -   **longitude (_number_)** -- The longitude in degrees.
    -   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
    -   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.
    -   **altitudeAccuracy (_number_)** -- The accuracy of the altitude value, in meters (iOS only).
    -   **heading (_number_)** -- Horizontal direction of travel of this device, measured in degrees starting at due north and continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is 180 degrees, and so on.
    -   **speed (_number_)** -- The instantaneous speed of the device in meters per second.
-   **timestamp (_number_)** -- The time at which this position information was obtained, in milliseconds since epoch.

### Type `Region`

Object of type `Region` includes following fields:

-   **identifier (_string_)** -- The identifier of the region object passed to `startGeofencingAsync` or auto-generated.
-   **latitude (_number_)** -- The latitude in degress of region's center point.
-   **longitude (_number_)** -- The longitude in degress of region's center point.
-   **radius (_number_)** -- The radius measured in meters that defines the region's outer boundary.
-   **state (_[Location.GeofencingRegionState](#expolocationgeofencingregionstate)_)** -- One of [Location.GeofencingRegionState](#expolocationgeofencingregionstate) region state. Determines whether the device is inside or outside a region.

## Enums

### `Expo.Location.Accuracy`

| Accuracy                     | Value | Description                                                                                   |
| ---------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| `Accuracy.Lowest`            |   1   | Accurate to the nearest three kilometers.                                                     |
| `Accuracy.Low`               |   2   | Accurate to the nearest kilometer.                                                            |
| `Accuracy.Balanced`          |   3   | Accurate to within one hundred meters.                                                        |
| `Accuracy.High`              |   4   | Accurate to within ten meters of the desired target.                                          |
| `Accuracy.Highest`           |   5   | The best level of accuracy available.                                                         |
| `Accuracy.BestForNavigation` |   6   | The highest possible accuracy that uses additional sensor data to facilitate navigation apps. |

### `Expo.Location.GeofencingEventType`

| Event type                  | Value | Description                                        |
| --------------------------- | ----- | -------------------------------------------------- |
| `GeofencingEventType.Enter` |   1   | Emitted when the device entered observed region.   |
| `GeofencingEventType.Exit`  |   2   | Occurs as soon as the device left observed region. |

### `Expo.Location.GeofencingRegionState`

| Region state                    | Value | Description                                     |
| ------------------------------- | ----- | ----------------------------------------------- |
| `GeofencingRegionState.Inside`  |   1   | Indicates that the device is inside the region. |
| `GeofencingRegionState.Outside` |   2   | Inverse of inside state.                        |
