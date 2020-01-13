# expo-firebase-analytics

> **This is the only Firebase Analytics package for React Native that has universal platform support (iOS, Android, Web, and Electron).**

`expo-firebase-analytics` enables the use of native Google Analytics for Firebase. Google Analytics for Firebase is a free app measurement solution that provides insight on app usage and user engagement.
Learn more in the official [Firebase Docs](https://firebase.google.com/docs/analytics/).

# Usage

## Managed Workflow

- Firebase Analytics requires build-time configuration, meaning you'll need to create a custom build to test functionality.
- There is a workaround for iOS which allows you to test your project without needing to create a custom build or eject to the bare-workflow. If you're an iOS developer you should start with this.

Create a native Firebase project for iOS and Android from the Firebase console.
- Add the Android `google-services.json` to your project and link to it in your `app.json` with the `expo.android.googleServicesFile: "path to .json file"` key

- Add the iOS `GoogleService-Info.plist` to your project and link to it in your `app.json` with the `expo.ios.googleServicesFile: "path to .plist file"`


## Bare Workflow

This package fully supports the bare-workflow. In some cases it might be easier to eject to bare-workflow just to test your Firebase app locally, then build it in the managed workflow.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/firebase-analytics.md)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-firebase-analytics
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).


**Optional: Enable AdSupport (Bare Workflow)**

To get extra features like `audiences`, `campaign attribution`, and some `user properties`, such as `Age` and `Interests`, you will need to include AdSupport.
This isn't enabled by default because Apple & Google are strict with allowing apps to use this library.

To enable the AdSupport framework:

- In your Xcode project, select your project's target
- Select the General tab for your target
- Expand the Linked Frameworks and Libraries section
- Click `+` to add a framework
- Select `AdSupport.framework`

[Learn more in the Firebase Docs](https://firebase.google.com/support/guides/analytics-adsupport)

# Docs

```js
import * as Analytics from 'expo-firebase-analytics';
```

To use web analytics, you'll also need to install the peer dependency **firebase** with `yarn add firebase`.

## Methods

### initializeAppDangerously

```tsx
initializeAppDangerously(googleServices: { [key: string]: any }): Promise<void>
```

Similar to `firebase.initializeApp()` on web but works to start a native Firebase app while the app is running.
This can be used to test the native iOS Firebase app in the Expo client.
This method should not be used in production, instead the app should be bundled with the native Google Services files via the `app.json`.

> You can convert your `GoogleService-Info.plist` using `npx plist-to-json ./GoogleService-Info.plist`.

#### Parameters

| Name       | Type   | Description                                                      |
| ---------- | ------ | ---------------------------------------------------------------- |
| name       | string | Platform specific Google Services file for starting a Firebase app during runtime  |

#### Example

```js
if (Platform.OS === 'ios' && global.__DEV__ === true) {
  await Analytics.initializeAppDangerously({ /* GoogleService-Info.plist contents as JSON. */ });
}
```

### deleteDefaultApp

```tsx
deleteDefaultApp(): Promise<void>
```

Delete the default Firebase app instance. If no default app is running then nothing happens.

#### Example

```js
await Analytics.deleteDefaultApp();
```

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

| Name       | Type   | Description                                                      |
| ---------- | ------ | ---------------------------------------------------------------- |
| name       | string | The name of the event. Should contain 1 to 40 alphanumeric characters or underscores. The name must start with an alphabetic character. Some event names are reserved. The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used. Note that event names are case-sensitive and that logging two events whose names differ only in case will result in two distinct events.                               |
| properties     | Object | The dictionary of event parameters. Passing `undefined` indicates that the event has no parameters. Parameter names can be up to 40 characters long and must start with an alphabetic character and contain only alphanumeric characters and underscores. Only `String` and `Number` (signed 64-bit integer and 64-bit floating-point number) parameter types are supported. `String` parameter values can be up to 100 characters long. The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used for parameter names. |

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

| Name       | Type   | Description                            |
| ---------- | ------ | -------------------------------------- |
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

| Name       | Type   | Description                            |
| ---------- | ------ | -------------------------------------- |
| screenName | string | The name of the current screen. Should contain 1 to 100 characters. Set to `undefined` to clear the current screen name. |
| screenClassOverride | string | The name of the screen class. Should contain 1 to 100 characters. By default this is the class name of the current screen (UIViewController on iOS). Set to `undefined` to revert to the default class name.|

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

| Name         | Type   | Description                         | Default |
| ------------ | ------ | ----------------------------------- | ------- |
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

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| userId   | `string | null` | The user ID to ascribe to the user of this app on this device, which must be non-empty and no more than 256 characters long. Setting userID to null removes the user ID.     |

#### Example

```tsx
await Analytics.setUserId('bacon_boi_uid');
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

| Name  | Type           | Description    |
| ----- | -------------- | -------------- |
| name  | `string`         | The name of the user property to set. Should contain 1 to 24 alphanumeric characters or underscores and must start with an alphabetic character. The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used for user property names.  |
| value | `string | null` | The value of the user property. Values can be up to 36 characters long. Setting the value to null removes the user property. |

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

Sets multiple user properties to the supplied values. This is a web-only method that's polyfilled on native to use `setUserProperty`.

#### Parameters

| Name   | Type   | Description                      |
| ------ | ------ | -------------------------------- |
| properties | `Object` | key/value set of user properties |

#### Example

```tsx
await Analytics.setUserProperties({
  loves_expo: 'a lot',
});
```

### getBundledGoogleServicesConfig

```tsx
getBundledGoogleServicesConfig(): null | { [key: string]: any }
```

Get the bundled Google Services config file.
This is useful for debugging if your app was built properly.


# Examples

## How do people use my app?

You can gain deeper insight into what works and what doesn't by using the `logEvent` property. Also it's just a lot of fun to see that people actually use the features you work hard on! 😍

```tsx
/*
 * Say we are in a tinder clone, and a user presses the card to view more
 * information on a user. We should track this event so we can see if people * are even using it.
 *
 * If lots of users are opening the card then swiping through photos, just
 * to dismiss again, then we should consider making it possible to look
 * through photos without having to enter the profile.
 */
onPressProfileButton = (uid) => {
  await Analytics.logEvent('ExpandProfile', {
    /*
     * We want to know if the user came from from the swipe card as
     * opposed to from chat or a deep link.
     */
    sender: "card",
    /*
     * This may be too specific and not very useful, but maybe down the line * we could investigate why a certain user is more popular than others.
     */
    user: uid,
    /*
     * We can use this information later to compare against other events.
     */
    screen: 'profile',
    purpose: "Viewing more info on a user",
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

## Variable Data

Ensure your data is Firebase compliant.

```js
import * as Analytics from 'expo-firebase-analytics';

function ensureFormat(input) {
  if (input != null) {
    return input.toString().replace(/\W/g, '');
  } else {
    return '';
  }
}

const eventName = ensureFormat(someWackyValue);

Analytics.logEvent(eventName);
```
