# expo-firebase-notifications

`expo-firebase-notifications` enables support for both remote (FCM) and local notifications.

[**Full documentation**](https://rnfirebase.io/docs/master/notifications/introduction)

## Installation

First you need to install `expo-firebase-messaging`.

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-notifications` or `yarn add expo-firebase-notifications`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseNotifications', path: '../node_modules/expo-firebase-notifications/ios'
```

and run `pod install`.

#### Manually

You could also choose install this module manually.

1.  In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2.  Go to `node_modules` ➜ `expo-firebase-notifications` and add `EXFirebaseNotifications.xcodeproj`
3.  In XCode, in the project navigator, select your project. Add `libEXFirebaseNotifications.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4.  Run your project (`Cmd+R`).

#### Common Setup

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
```

### Android

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
/*
 * At the top of the file.
 * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
*/
import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
import expo.modules.firebase.notifications.FirebaseNotificationsPackage;

// Later in the file...

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

### [Performing the action in the background](https://rnfirebase.io/docs/v5.x.x/notifications/android-actions)

By default, the action will cause your application to open and come to the foreground. If you'd like to override this behaviour, for example, to support a snooze action then you need to follow these steps.

> If the app is already in the foreground then the action will still need to be handled in the normal onNotificationOpened listener

1. Update `AndroidManifest.xml`
   If you would like to schedule local notifications then you also need to add the following to the application component of android/app/src/main/AndroidManifest.xml:
   ```xml
   <application ...>
     <receiver android:name="expo.modules.firebase.notifications.FirebaseBackgroundNotificationActionReceiver" android:exported="true">
       <intent-filter>
         <action android:name="expo.modules.firebase.notifications.BackgroundAction"/>
       </intent-filter>
     </receiver>
     <service android:name="expo.modules.firebase.notifications.FirebaseBackgroundNotificationActionsService"/>
   </application>
   ```
2. Handle background actions
   Create a new Javascript file (for this example we'll call it `bgActions.js`) which has the following structure:

   ```js
   // @flow
   import firebase from 'expo-firebase-app';
   // Optional flow type
   import type { NotificationOpen } from 'expo-firebase-notifications';

   export default async (notificationOpen: NotificationOpen) => {
     if (notificationOpen.action === 'snooze') {
       // handle the action
     }

     return Promise.resolve();
   };
   ```

   > This handler method must return a promise and resolve within 60 seconds.

3. Register the background handler
   In your main `App.js` you need to register your background handler as follows:

   ```js
   import bgActions from './bgActions'; // <-- Import the file you created in (2)
   // New task registration
   AppRegistry.registerHeadlessTask('FirebaseBackgroundNotificationAction', () => bgActions);
   ```

   > The name **`"FirebaseBackgroundNotificationAction"`** is very important!

4. Create your action with showUserInterface false

   ```js
   // Set up your listener
   firebase.notifications().onNotificationOpened(notificationOpen => {
     // notificationOpen.action will equal 'snooze'
   });

   // Build your notification
   const notification = new firebase.notifications.Notification()
     .setTitle('Android Notification Actions')
     .setBody('Action Body')
     .setNotificationId('notification-action')
     .setSound('default')
     .android.setChannelId('notification-action')
     .android.setPriority(firebase.notifications.Android.Priority.Max);
   // Build an action
   const action = new firebase.notifications.Android.Action(
     'snooze',
     'ic_launcher',
     'My Test Action'
   );
   // This is the important line
   action.setShowUserInterface(false);
   // Add the action to the notification
   notification.android.addAction(action);

   // Display the notification
   firebase.notifications().displayNotification(notification);
   ```
