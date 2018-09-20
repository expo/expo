# expo-firebase-notifications

`expo-firebase-notifications` enables support for both remote (FCM) and local notifications.

[**Full documentation**](https://rnfirebase.io/docs/master/notifications/introduction)

## Installation

First you need to install `expo-firebase-messaging`.

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-notifications` or `yarn add expo-firebase-notifications`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseNotifications', path: '../node_modules/expo-firebase-notifications/ios'
```

and run `pod install`.

**Update `AppDelegate.m`**

Add the following import to the top of your `ios/[App Name]/AppDelegate.m:`

```objective-c
#import "<EXFirebaseNotifications/EXFirebaseNotifications.h>"
```

Add the following to the `didFinishLaunchingWithOptions:(NSDictionary *)launchOptions` method, at the end of the function.

```objective-c
[EXFirebaseNotifications configure];
```

Add the following method to your `ios/[App Name]/AppDelegate.m`:

```objective-c
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification {
  [[EXFirebaseNotifications instance] didReceiveLocalNotification:notification];
}
```

[Based on the RNFirebase iOS setup](https://rnfirebase.io/docs/master/notifications/ios)

**Remote Notifications (Optional)**

If you would like to support Remote Notifications via FCM, also add the following import to the top of your `ios/[App Name]/AppDelegate.m:`

#import <EXFirebaseMessaging/EXFirebaseMessaging.h>

Then add the following methods to your `ios/[App Name]/AppDelegate.m`:

```objective-c
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo
                                                       fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
  [[EXFirebaseNotifications instance] didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
  [[EXFirebaseMessaging instance] didRegisterUserNotificationSettings:notificationSettings];
}
```

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-notifications'
    project(':expo-firebase-notifications').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-notifications/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')

    include ':expo-firebase-messaging'
    project(':expo-firebase-messaging').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-messaging/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-notifications')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    api project(':expo-firebase-app')
    api project(':expo-firebase-messaging')
    ```

Some Unimodules are not included in the default `ExpoKit` suite, these modules will needed to be added manually.
If your Android build cannot find the Native Modules, you can add them like this:

`./android/app/src/main/java/host/exp/exponent/MainActivity.java`

```java
@Override
public List<Package> expoPackages() {
  // Here you can add your own packages.
  return Arrays.<Package>asList(
    new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
    new FirebaseNotificationsPackage() // Include this.
  );
}
```

## Usage

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import firebase from 'expo-firebase-app';
import { Permissions } from 'expo-permissions';

// Include the module before using it.
import 'expo-firebase-instance-id';
import 'expo-firebase-messaging';
import 'expo-firebase-notifications';

import type { Notification } from 'expo-firebase-notifications';

// API can be accessed with: firebase.notifications();

export default class DemoView extends React.Component {
  state = { user: null };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    if (status !== 'granted') return;

    this.notificationDisplayedListener = firebase
      .notifications()
      .onNotificationDisplayed((notification: Notification) => {
        // Process your notification as required
        // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
      });
    this.notificationListener = firebase
      .notifications()
      .onNotification((notification: Notification) => {
        // Process your notification as required
      });

    // Get device push token
    const token = await firebase.iid().getToken();
  }

  componentWillUnmount() {
    // Clean up: remove the listener
    this.notificationDisplayedListener();
    this.notificationListener();
  }

  render() {
    return <View />;
  }
}
```
