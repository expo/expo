# expo-firebase-invites

`expo-firebase-invites` provides a built-in solution for app referrals and sharing via email or SMS.

[**Full documentation**](https://rnfirebase.io/docs/master/invites/reference/invites)

## Installation

Make sure to install and setup `expo-firebase-links` before proceeding.

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-invites` or `yarn add expo-firebase-invites`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseInvites', path: '../node_modules/expo-firebase-invites/ios'
```

and run `pod install`.

[Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/invites/ios#Update-%3Ccode%3EAppDelegate.m%3C/code%3E)

Invites will only work on iOS if the user is authenticated with Google.

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

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-invites'
    project(':expo-firebase-invites').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-invites/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')

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
    api project(':expo-core')
    api project(':expo-firebase-app')
    api project(':expo-firebase-links')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/invites/android)

Some Unimodules are not included in the default `ExpoKit` suite, these modules will needed to be added manually.
If your Android build cannot find the Native Modules, you can add them like this:

`./android/app/src/main/java/host/exp/exponent/MainActivity.java`

```java
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
// Include the module before using it.
import 'expo-firebase-links';
import 'expo-firebase-invites';
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
