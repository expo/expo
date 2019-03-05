# expo-firebase-invites

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-invites` provides a built-in solution for app referrals and sharing via email or SMS.

[**Full documentation**](https://rnfirebase.io/docs/master/invites/reference/invites)

## Installation

Make sure to install and setup `expo-firebase-links` before proceeding.

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-invites` or `yarn add expo-firebase-invites`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseInvites', path: '../node_modules/expo-firebase-invites/ios'
```

and run `pod install`.

#### Common Setup

[Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/invites/ios#Update-%3Ccode%3EAppDelegate.m%3C/code%3E)

> Invites will only work on iOS if the user is authenticated with Google.

**Update AppDelegate.m**

Replace the `EXFirebaseLinks` import with `EXFirebaseInvites` at the top of your `ios/[App Name]/AppDelegate.m`:

```objc
#import "EXFirebaseInvites.h"
```

Replace the `EXFirebaseLinks` methods with `EXFirebaseInvites` as follows:

```obj
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options {
  return [[EXFirebaseInvites instance] application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler {
  return [[EXFirebaseInvites instance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}
```

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-invites'
    project(':expo-firebase-invites').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-invites/android')
    ```

    and if not already included

    ```gradle
    include ':unimodules-core'
    project(':unimodules-core').projectDir = new File(rootProject.projectDir, '../node_modules/@unimodules/core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')

     include ':expo-firebase-links'
    project(':expo-firebase-links').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-links/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-invites')
    ```
    and if not already included
    ```gradle
    api project(':unimodules-core')
    api project(':expo-firebase-app')
    api project(':expo-firebase-links')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/invites/android)
4.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
    import expo.modules.firebase.invites.FirebaseInvitesPackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseInvitesPackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import firebase from 'expo-firebase-app';

// API can be accessed with: firebase.invites();

export default class DemoView extends React.Component {
  async componentDidMount() {
    // ... initialize firebase app

    const invitation = new firebase.invites.Invitation('Title', 'Message');
    invitation.setDeepLink('https://je786.app.goo.gl/testing');

    try {
      // send the invitation
      const invitationIds = await firebase.invites().sendInvitation(invitation);
    } catch ({ message }) {
      // An Error was thrown.
      console.warn(message);
    }
  }
  render() {
    return <View />;
  }
}
```

## Trouble Shooting

If you run into issues installing the ios Pod, you may want to update `GoogleSignIn`. You can do this with: `pod update GoogleSignIn`
