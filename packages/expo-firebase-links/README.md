# expo-firebase-links

`expo-firebase-links` exposes the native Firebase Dynamic Linking API. You can create and share links for both iOS and Android.

[**Full documentation**](https://rnfirebase.io/docs/master/links/reference/links)

## Installation

Firstly, you need to install the package from `npm` registry.

`npm install expo-firebase-links` or `yarn add expo-firebase-links`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseLinks', path: '../node_modules/expo-firebase-links/ios'
```

and run `pod install`.

[Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/links/ios#Configure-XCode)

**Update your AppDelegate.m file:**

Import RN Firebase Links header file:

```objc
#import "EXFirebaseLinks.h"
```

Add the following to the didFinishLaunchingWithOptions method before `[FIRApp Configure]`:

```objc
[FIROptions defaultOptions].deepLinkURLScheme = CUSTOM_URL_SCHEME;
```

> ^-- where `CUSTOM_URL_SCHEME` is the custom URL scheme you defined in your Xcode project.

Add the following inside the `@implementation AppDelegate` annotation:

```objc
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options {
  return [[EXFirebaseLinks instance] application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler {
  return [[EXFirebaseLinks instance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}
```

You might run into situation when you need to handle more than one link configuration
i.e. when using Facebook SDK to handle push notification / login links
if that is the case you can perform check below

```objc
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  BOOL handled = [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey] annotation:options[UIApplicationOpenURLOptionsAnnotationKey]];

  if (!handled) {
      handled = [[EXFirebaseLinks instance] application:application openURL:url options:options];
  }

  return handled;
}
```

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-links'
    project(':expo-firebase-links').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-links/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-links')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    api project(':expo-firebase-app')
    ```
3.  [Now follow the configuration instructions in the docs.](https://rnfirebase.io/docs/master/links/android#Configure-Android-Project)

Some Unimodules are not included in the default `ExpoKit` suite, these modules will needed to be added manually.
If your Android build cannot find the Native Modules, you can add them like this:

`./android/app/src/main/java/host/exp/exponent/MainActivity.java`

```java
@Override
public List<Package> expoPackages() {
  // Here you can add your own packages.
  return Arrays.<Package>asList(
    new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
    new FirebaseLinksPackage() // Include this.
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
// API can be accessed with: firebase.links();

export default class DemoView extends React.Component {
  async componentDidMount() {
    // ... initialize firebase app

    const link = new firebase.links.DynamicLink(
      'https://example.com?param1=foo&param2=bar',
      'abc123.app.goo.gl'
    ).android
      .setPackageName('com.example.android')
      .ios.setBundleId('com.example.ios');

    try {
      // Create a url that you can share with others.
      const url = await firebase.links().createDynamicLink(link);
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
