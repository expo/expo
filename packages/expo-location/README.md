
# expo-location

`expo-location` module allows reading geolocation information from the device. Your app can poll for the current location or subscribe to location update events.

## Installation

*If your app is running in [Expo](https://expo.io) then everything is already set up for you, just `import { Location } from 'expo';`*

Otherwise, you need to install the package from `npm` registry.

`yarn add expo-location` or `npm install expo-location`

Also, make sure that you have [expo-core](https://github.com/expo/expo-core) and [expo-permissions](https://github.com/expo/expo-permissions) installed, as they are required by `expo-location` to work properly.

#### iOS

Add the dependency to your `Podfile`:

```ruby
pod 'EXLocation', path: '../node_modules/expo-location/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

#### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-location'
    project(':expo-location').projectDir = new File(rootProject.projectDir, '../node_modules/expo-location/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-location')
    ```
3.  Add `new LocationPackage()` to your module registry provider in `MainApplication.java`.

## Usage

You must request permission to access the user's location before attempting to get it. To do this, you will want to use the [Permissions](https://github.com/expo/expo-permissions) API. You can see this in practice in the following example.

```javascript
import React, { Component } from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { Location } from 'expo-location';
import { Permissions } from 'expo-permissions';

export default class App extends Component {
  state = {
    location: null,
    errorMessage: null,
  };

  componentDidMount() {
    this.getLocationAsync();
  }

  getLocationAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };

  render() {
    let text = 'Waiting...';

    if (this.state.errorMessage) {
      text = this.state.errorMessage;
    } else if (this.state.location) {
      text = JSON.stringify(this.state.location);
    }

    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>{text}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: 'center',
  },
});
```

## Methods

### `Location.getCurrentPositionAsync(options)`

Get the current position of the device.

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **enableHighAccuracy (_boolean_)** -- Whether to enable high-accuracy mode. For low-accuracy the implementation can avoid geolocation providers that consume a significant amount of power (such as GPS).
    -   **maximumAge (_number_)** -- (Android only). If specified, allow returning a previously cached position that is at most this old in milliseconds. If not specified, always gets a new location. On iOS this option is ignored and a new location is always returned.

#### Returns

Returns a promise resolving to an object with the following fields:

-   **coords (_object_)** -- The coordinates of the position, with the following fields:
    -   **latitude (_number_)** -- The latitude in degrees.
    -   **longitude (_number_)** -- The longitude in degrees.
    -   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
    -   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.
    -   **altitudeAccuracy (_number_)** -- The accuracy of the altitude value, in meters (iOS only).
    -   **heading (_number_)** -- Horizontal direction of travel of this device, measured in degrees starting at due north and continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is 180 degrees, and so on.
    -   **speed (_number_)** -- The instantaneous speed of the device in meters per second.
-   **timestamp (_number_)** -- The time at which this position information was obtained, in milliseconds since epoch.

### `Location.watchPositionAsync(options, callback)`

Subscribe to location updates from the device. Please note that updates will only occur while the application is in the foreground. Background location tracking is [planned](https://expo.canny.io/feature-requests/p/background-location-tracking), but not yet implemented.

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

Returns a promise resolving to a subscription object, which has one field:

-   **remove (_function_)** -- Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.

### `Location.getProviderStatusAsync()`

Check status of location providers.

#### Returns

Returns a promise resolving to an object with the following fields:

-   **locationServicesEnabled (_boolean_)** -- Whether location services are enabled.
-   **gpsAvailable (_boolean_)** (android only) -- If the GPS provider is available, if yes, location data will be from GPS.
-   **networkAvailable (_boolean_)** (android only) -- If the network provider is available, if yes, location data will be from cellular network.
-   **passiveAvailable (_boolean_)** (android only) -- If the passive provider is available, if yes, location data will be determined passively.

### `Location.getHeadingAsync()`

Gets the current heading information from the device

#### Returns

Object with:

- **magHeading (_number_)** — measure of magnetic north in degrees
- **trueHeading (_number_)** — measure of true north in degrees (needs location permissions, will return -1 if not given)
- **accuracy (_number_)** — level of callibration of compass.
  - 3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: none
  - Reference for iOS: 3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees


### `Location.watchHeadingAsync(callback)`

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

Returns a promise resolving to a subscription object, which has one field:

- **remove (function)** — Call this function with no arguments to remove this subscription. The callback will no longer be called for location updates.

### `Location.geocodeAsync(address)`

Geocode an address string to latitiude-longitude location.

> **Note**: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error so they have to be managed properly.
>
> On Android, you must request a location permission (`Permissions.LOCATION`) from the user before geocoding can be used.

#### Arguments

- **address (_string_)** -- A string representing address, eg. "Baker Street London"

#### Returns

Returns a promise resolving to an array (in most cases its size is 1) of geocoded location objects with the following fields:

-   **latitude (_number_)** -- The latitude in degrees.
-   **longitude (_number_)** -- The longitude in degrees.
-   **altitude (_number_)** -- The altitude in meters above the WGS 84 reference ellipsoid.
-   **accuracy (_number_)** -- The radius of uncertainty for the location, measured in meters.

### `Location.reverseGeocodeAsync(location)`

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

### `Location.setApiKey(apiKey)`

Sets a Google API Key for using Geocoding API. This method can be useful for Android devices that do not have Google Play Services, hence no Geocoder Service. After setting the key using Google's API will be possible.

#### Arguments

-   **apiKey (_string_)** -- API key collected from Google Developer site.