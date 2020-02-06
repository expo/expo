---
title: Firebase Analytics
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-firebase-analytics'
---

import TableOfContentSection from '~/components/plugins/TableOfContentSection';

> **This is the only Firebase Analytics package for React Native that has universal platform support (iOS, Android, Web, and Electron).**

**`expo-firebase-analytics`** enables the use of native Google Analytics for Firebase. Google Analytics for Firebase is a free app measurement solution that provides insight on app usage and user engagement.
Learn more in the official [Firebase Docs](https://firebase.google.com/docs/analytics/).


#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator | Web |
| -------------- | ---------------- | ---------- | ------------- | --- |
| ✅              | ✅                | ✅          | ✅             | ❌   |



# TODO
- link to configuration
- web init
- Support limitation onExpo client 


# Docs

```js
import * as Analytics from 'expo-firebase-analytics';
```

To use web analytics, you'll also need to install the peer dependency **firebase** with `yarn add firebase`.

## Methods

### logEvent

```tsx
logEvent(name: string, properties?: { [key: string]: any }): Promise<void>
```

Logs an app event. The event can have up to 25 parameters. Events with the same name must have
the same parameters. Up to 500 event names are supported. Using predefined events and/or
parameters is recommended for optimal reporting.
 
The following event names are reserved and cannot be used:
- `ad_activeview`
- `ad_click`
- `ad_exposure`
- `ad_impression`
- `ad_query`
- `adunit_exposure`
- `app_clear_data`
- `app_remove`
- `app_update`
- `error`
- `first_open`
- `in_app_purchase`
- `notification_dismiss`
- `notification_foreground`
- `notification_open`
- `notification_receive`
- `os_update`
- `screen_view`
- `session_start`
- `user_engagement`

#### Parameters

| Name       | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name       | string | The name of the event. Should contain 1 to 40 alphanumeric characters or underscores. The name must start with an alphabetic character. Some event names are reserved. The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used. Note that event names are case-sensitive and that logging two events whose names differ only in case will result in two distinct events.                                                                                                                                              |
| properties | Object | The dictionary of event parameters. Passing `undefined` indicates that the event has no parameters. Parameter names can be up to 40 characters long and must start with an alphabetic character and contain only alphanumeric characters and underscores. Only `String` and `Number` (signed 64-bit integer and 64-bit floating-point number) parameter types are supported. `String` parameter values can be up to 100 characters long. The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used for parameter names. |

#### Example

```js
await Analytics.logEvent('ButtonTapped', {
  name: 'settings',
  screen: 'profile',
  purpose: 'Opens the internal settings',
});
```

### setAnalyticsCollectionEnabled

```tsx
setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void>
```

Sets whether analytics collection is enabled for this app on this device. This setting is persisted across app sessions. **By default it is enabled.**

#### Parameters

| Name      | Type    | Description                                           |
| --------- | ------- | ----------------------------------------------------- |
| isEnabled | boolean | A flag that enables or disables Analytics collection. |

#### Example

```tsx
await Analytics.setAnalyticsCollectionEnabled(false);
```

### setCurrentScreen

```tsx
setCurrentScreen(screenName: string, screenClassOverride?: string): Promise<void>
```

Sets the current screen name, which specifies the current visual context in your app. This helps
identify the areas in your app where users spend their time and how they interact with your app.

#### Parameters

| Name                | Type   | Description                                                                                                                                                                                                  |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| screenName          | string | The name of the current screen. Should contain 1 to 100 characters. Set to `undefined` to clear the current screen name.                                                                                     |
| screenClassOverride | string | The name of the screen class. Should contain 1 to 100 characters. By default this is the class name of the current screen (UIViewController on iOS). Set to `undefined` to revert to the default class name. |

#### Example

```js
await Analytics.setCurrentScreen('GiveGithubStarsScreen');
```

### setSessionTimeoutDuration

```tsx
setSessionTimeoutDuration(milliseconds: number): Promise<void>
```

Sets the interval of inactivity in seconds that terminates the current session. The default value is 1800000 milliseconds (30 minutes).

#### Parameters

| Name         | Type   | Description                                                                          | Default |
| ------------ | ------ | ------------------------------------------------------------------------------------ | ------- |
| milliseconds | number | The custom time of inactivity in milliseconds before the current session terminates. | 1800000 |

#### Example

```tsx
// 15 mins
await Analytics.setSessionTimeoutDuration(900000);
```

### setUserId

```tsx
setUserId(userId: string | null): Promise<void>
```

Sets the user ID property. This feature must be used in accordance with [Google's Privacy Policy](https://www.google.com/policies/privacy)

#### Parameters

| Name   | Type            | Description                                                                                                                                                              |
| ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| userId | `string | null` | The user ID to ascribe to the user of this app on this device, which must be non-empty and no more than 256 characters long. Setting userID to null removes the user ID. |

#### Example

```tsx
await Analytics.setUserId('my_user_uid');
```

### setUserProperty

```tsx
setUserProperty(name: string, value: string | null): Promise<void>
```

Sets a user property to a given value. Up to 25 user property names are supported. Once set,
user property values persist throughout the app life-cycle and across sessions.

The following user property names are reserved and cannot be used:
- `first_open_time`
- `last_deep_link_referrer`
- `user_id`

#### Parameters

| Name  | Type            | Description                                                                                                                                                                                                                                                  |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name  | `string`        | The name of the user property to set. Should contain 1 to 24 alphanumeric characters or underscores and must start with an alphabetic character. The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used for user property names. |
| value | `string | null` | The value of the user property. Values can be up to 36 characters long. Setting the value to null removes the user property.                                                                                                                                 |

#### Example

```tsx
await Analytics.setUserProperty('favorite_batmobile', '1989 Burton-mobile');
```

### resetAnalyticsData

```tsx
resetAnalyticsData(): Promise<void>
```

Clears all analytics data for this instance from the device and resets the app instance ID.

#### Example

```tsx
await Analytics.resetAnalyticsData();
```

### setUserProperties

```tsx
setUserProperties(properties: { [key: string]: string }): Promise<void>
```

Sets multiple user properties to the supplied values.

#### Parameters

| Name       | Type     | Description                      |
| ---------- | -------- | -------------------------------- |
| properties | `Object` | key/value set of user properties |

#### Example

```tsx
await Analytics.setUserProperties({
  loves_expo: 'a lot',
});
```


### setUnavailabilityLogging

```tsx
setUnavailabilityLogging(isEnabled: boolean): void
```

Enables or disables the warning and log messages when using Firebase Analytics on the Expo client.

Firebase Analytics is not available on the Expo client and therefore logs the requests to the console
for development purposes. To test Firebase Analytics, create a stand-alone build or custom client.
This function can be called to disable the warning and log messages when using Firebase Analytics
on the Expo client.

#### Parameters

| Name      | Type      | Description               |
| --------- | --------- | ------------------------- |
| isEnabled | `boolean` | Enable or disable logging |

#### Example

```tsx
// Disable the warning & log messages on the Expo client
Analytics.setUnavailabilityLogging(false);
```


# Examples

## How do people use my app?

You can gain deeper insight into what works and what doesn't by using the `logEvent` property. Also it's just a lot of fun to see that people actually use the features you work hard on! 😍

```tsx
/*
 * Say we are in a tinder clone, and a user presses the card to view more
 * information on a user. We should track this event so we can see if people
 * are even using it.
 *
 * If lots of users are opening the card then swiping through photos, just
 * to dismiss again, then we should consider making it possible to look
 * through photos without having to enter the profile.
 */
onPressProfileButton = (uid) => {
  Analytics.logEvent('ExpandProfile', {
    /*
     * We want to know if the user came from from the swipe card as
     * opposed to from chat or a deep link.
     */
    sender: 'card',
    /*
     * This may be too specific and not very useful, but maybe down the line * we could investigate why a certain user is more popular than others.
     */
    user: uid,
    /*
     * We can use this information later to compare against other events.
     */
    screen: 'profile',
    purpose: 'Viewing more info on a user',
  });
}
```

## React Navigation

You can track the screens your users are interacting with by integrating the best navigation library: `react-navigation`

[Read more about how this works](https://reactnavigation.org/docs/en/screen-tracking.html)

```js
import React from 'react';
// Import Navigation
import { createBottomTabNavigator } from 'react-navigation';
// Import Firebase
import * as Analytics from 'expo-firebase-analytics';
// Import some screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// Create a generic Navigator
const AppNavigator = createBottomTabNavigator({
  // The name `Profile` or `Home` are what will appear in Firebase Analytics.
  Profile: ProfileScreen,
  Home: HomeScreen,
});
// Get the current screen from the navigation state
function getActiveRouteName(navigationState) {
  if (!navigationState) return null;
  const route = navigationState.routes[navigationState.index];
  // Parse the nested navigators
  if (route.routes) return getActiveRouteName(route);
  return route.routeName;
}

export default () => (
  <AppNavigator
    onNavigationStateChange={(prevState, currentState) => {
      const currentScreen = getActiveRouteName(currentState);
      const prevScreen = getActiveRouteName(prevState);
      if (prevScreen !== currentScreen) {
        // Update Firebase with the name of your screen
        Analytics.setCurrentScreen(currentScreen);
      }
    }}
  />
);
```
