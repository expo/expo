# expo-firebase-analytics

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-analytics` enables the use of native Google Analytics for Firebase.

Google Analytics for Firebase is a free app measurement solution that provides insight on app usage and user engagement.
Learn more in the offical [Firebase Docs](https://firebase.google.com/docs/analytics/)

This library is based on RNFirebase, see the docs here: [**RNFirebase docs**](https://rnfirebase.io/docs/master/analytics/reference/analytics)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-analytics` or `yarn add expo-firebase-analytics`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseAnalytics', path: '../node_modules/expo-firebase-analytics/ios'
```

and run `pod install`.

#### Common Setup

**Optional: Enable AdSupport**

To get extra features like `audiences`, `campaign attribution`, and some `user properties`, such as `Age` and `Interests`, you will need to include AdSupport.
This isn't in by default as Apple & Google are strict with this library.

To enable the AdSupport framework:

- In your Xcode project, select your project's target
- Select the General tab for your target
- Expand the Linked Frameworks and Libraries section
- Click `+` to add a framework
- Select `AdSupport.framework`

[Learn more in the Firebase Docs](https://firebase.google.com/support/guides/analytics-adsupport)

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-analytics'
    project(':expo-firebase-analytics').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-analytics/android')
    ```

    and if not already included

    ```gradle
    include ':unimodules-core'
    project(':unimodules-core').projectDir = new File(rootProject.projectDir, '../node_modules/@unimodules/core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-analytics')
    ```
    and if not already included
    ```gradle
    api project(':unimodules-core')
    api project(':expo-firebase-app')
    ```
3.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
    import expo.modules.firebase.analytics.FirebaseAnalyticsPackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseAnalyticsPackage() // Include this.
      );
    }
    ```

# Docs

Once installed natively, the module can be accessed with:

```js
import firebase from 'expo-firebase-app';

firebase.analytics();
```

## Methods

### logEvent

```js
logEvent(name: string, params: Object = {}): Promise
```

Log a custom event with optional params.

#### Parameters

| Name       | Type   | Description                                                      |
| ---------- | ------ | ---------------------------------------------------------------- |
| name       | string | Defines the name of a custom event                               |
| params     | Object | key/value pair of event properties, max length of 100 characters |

#### Example

```js
await firebase.analytics().logEvent('ButtonTapped', {
  name: 'settings',
  screen: 'profile',
  purpose: 'Opens the internal settings',
});
```

### setCurrentScreen

```js
setCurrentScreen(screenName: string, screenClassOverride?: string): Promise
```

Sets the current screen name, which specifies the current visual context in your app.

#### Parameters

| Name       | Type   | Description                            |
| ---------- | ------ | -------------------------------------- |
| screenName | string | Defines the name of the current screen |

#### Example

```js
await firebase.analytics().setCurrentScreen('GiveGithubStarsScreen');
```

### setMinimumSessionDuration

```js
setMinimumSessionDuration(milliseconds: number = 10000): Promise
```

Sets the minimum engagement time required before starting a session.

#### Parameters

| Name         | Type   | Description                             | Default |
| ------------ | ------ | --------------------------------------- | ------- |
| milliseconds | number | minimum engagement time in milliseconds | 10000   |

#### Example

```js
await firebase.analytics().setMinimumSessionDuration(500);
```

### setSessionTimeoutDuration

```js
setSessionTimeoutDuration(milliseconds: number = 1800000): Promise
```

Sets the duration of inactivity that terminates the current session. The default value is 30 minutes.

#### Parameters

| Name         | Type   | Description                         | Default |
| ------------ | ------ | ----------------------------------- | ------- |
| milliseconds | number | inactivity duration in milliseconds | 1800000 |

#### Example

```js
// 15 mins
await firebase.analytics().setSessionTimeoutDuration(900000);
```

### setUserId

```js
setUserId(id: string | null): Promise
```

Sets the user ID property.

#### Parameters

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| id   | string \| null | user ID     |

#### Example

```js
await firebase.analytics().setUserId('bacon_boi_uid');
```

### setUserProperty

```js
setUserProperty(name: string, value: string | null): Promise
```

Sets a user property to a given value.

#### Parameters

| Name  | Type           | Description    |
| ----- | -------------- | -------------- |
| name  | string         | property name  |
| value | string \| null | property value |

#### Example

```js
await firebase.analytics().setUserProperty('favorite_batmobile', '1989 Burton-mobile');
```

### setUserProperties

```js
setUserProperties(object: Object): Promise
```

Sets multiple user properties to the supplied values.

#### Parameters

| Name   | Type   | Description                      |
| ------ | ------ | -------------------------------- |
| object | object | key/value set of user properties |

#### Example

```js
await firebase.analytics().setUserProperties({
  least_favorite_thing: 'instagram poser-programmers',
  knows_fortnite_dances: false,
  is_a_soyboy: 'true',
});
```

# Examples

## How do people use my app?

You can gain deeper insight into what works and what doesn't by using the `logEvent` property. Also it's just a lot of fun to see that people actually use the features you work hard on! 😍

```js
/*
 * Say we are in a tinder clone, and a user presses the card to view more
 * information on a user. We should track this event so we can see if people * are even using it.
 *
 * If lots of users are opening the card then swiping through photos, just
 * to dismiss again, then we should consider making it possible to look
 * through photos without having to enter the profile.
 */
onPressProfileButton = (uid) => {
  await firebase.analytics().logEvent('ExpandProfile', {
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
import firebase from 'expo-firebase-app';
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
        firebase.analytics().setCurrentScreen(currentScreen);
      }
    }}
  />
);
```

## Variable Data

Ensure your data is Firebase compliant.

```js
function ensureFormat(input) {
  if (input != null) {
    return input.toString().replace(/\W/g, '');
  } else {
    return '';
  }
}

const eventName = ensureFormat(someWackyValue);

firebase.analytics().logEvent(eventName);
```
