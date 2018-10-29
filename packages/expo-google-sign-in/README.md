# expo-google-sign-in

`expo-google-sign-in` enables native Google authentication features in your app!

## Installation

You need to install the package from `npm` registry.

`npm install expo-google-sign-in` or `yarn add expo-google-sign-in`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXGoogleSignIn', path: '../node_modules/expo-google-sign-in/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-google-sign-in'
    project(':expo-google-sign-in').projectDir = new File(rootProject.projectDir, '../node_modules/expo-google-sign-in/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-google-sign-in')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    ```
3.  In order to access this module from Expo, you will need to include it in the `expoPackages` export:
    `./android/app/src/main/java/host/exp/exponent/MainActivity.java`
    ```java
    @Override
    public List<Package> expoPackages() {
        // Here you can add your own packages.
        return Arrays.<Package>asList(
            new GoogleSignInPackage() // Include this.
        );
    }
    ```

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import { GoogleSignIn } from 'expo-google-sign-in';

export default class AuthScreen extends React.Component {
  initAsync = async () => {
    await GoogleSignIn.initAsync({
      /*
       * [iOS][Android][optional]: `accountName: ?string`
       * [default]: `[GoogleSignIn.SCOPES.PROFILE, GoogleSignIn.SCOPES.EMAIL]`
       * Pass the scopes you wish to have access to.
       */
      scopes: [GoogleSignIn.SCOPES.PROFILE, GoogleSignIn.SCOPES.EMAIL],

      /*
       * [iOS][Android][optional]: `webClientId: ?string`
       * [default]: `undefined`
       * The client ID of the home web server.  This will be returned as the |audience| property of the
       * OpenID Connect ID token.  For more info on the ID token:
       * https://developers.google.com/identity/sign-in/ios/backend-auth
       */
      webClientId: '603386649315-9rbv8vmv2vvftetfbvlrbufcps1fajqf.apps.googleusercontent.com',

      /* 
       * [iOS][Android][optional]: `accountName: ?string`
       * [default]: `undefined`
       * If you know the user's email address ahead of time, you can add it here and it will be the default option
       * if the user has approved access for this app, the Auth will return instantly.  
       */
      accountName: 'bacon@expo.io',

      /* 
       * [iOS][Android][optional]: `hostedDomain: ?string`
       * [default]: `undefined`
       * The Google Apps domain to which users must belong to sign in.  
       * To verify, check |GIDGoogleUser|'s |hostedDomain| property.
       */
      hostedDomain: undefined,

      /* 
       * [Android][optional]: `signInType?: GoogleSignIn.TYPES.DEFAULT | GoogleSignIn.TYPES.GAMES`
       * [default]: `undefined`
       * The Google Apps domain to which users must belong to sign in.  
       * To verify, check |GIDGoogleUser|'s |hostedDomain| property.
       */
      signInType: GoogleSignIn.TYPES.DEFAULT,

      /* 
       * [Android][optional]: `isOfflineEnabled: ?boolean`
       * [default]: `undefined`
       * The Google Apps domain to which users must belong to sign in.  
       * To verify, check |GIDGoogleUser|'s |hostedDomain| property.
       */
      isOfflineEnabled: true,

      /* 
       * [Android][optional]: `isPromptEnabled: ?boolean`
       * [default]: `undefined`
       * The Google Apps domain to which users must belong to sign in.  
       * To verify, check |GIDGoogleUser|'s |hostedDomain| property.
       */
      isPromptEnabled: true,

      /*
       * [iOS][optional]: `clientId: ?string`
       * [default]: Read from GoogleService-info.plist `CLIENT_ID` on iOS, and google-services.json `oauth_client.client_id` on Android.
       * The client ID of the app from the Google APIs console.  Must set for sign-in to work.
       * This value must be defined in the google-services.json on Android, you can define your custom google-services.json 
       * in the app.json before creating a standalone app. 
       * {
       *  ...
       *  "android": {
       *    "googleServicesFile": "./google-services.json",
       *    ...
       *   }
       * }
       */
      clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',

      /* 
       * [iOS][optional]: `language: ?string`
       * [default]: `undefined`
       * The language for sign-in, in the form of ISO 639-1 language code optionally followed by a dash
       * and ISO 3166-1 alpha-2 region code, such as |@"it"| or |@"pt-PT"|. Only set if different from
       * system default.
       */
      language: 'en-US', // iSO language codes. ex: `Expo.Localization.locale`

      /* 
       * [iOS][optional]: `openIdRealm?: ?string`
       * [default]: `undefined`
       * The OpenID2 realm of the home web server. This allows Google to include the user's OpenID
       * Identifier in the OpenID Connect ID token.. 
       */
      openIdRealm: null,
    });
    this._syncUserWithStateAsync();
  };

  _syncUserWithStateAsync = async () => {
    const user = await GoogleSignIn.getCurrentUserAsync();
    if (user) {
      // Get the Google photo, on iOS you can define what size to get.
      const photoURL = await GoogleSignIn.getPhotoAsync(256);
      this.setState({
        user: {
          ...GoogleSignIn.currentUser.toJSON(),
          photoURL: photoURL || GoogleSignIn.currentUser.photoURL,
        },
      });
    } else {
      this.setState({ user: null });
    }
  };

  signOutAsync = async () => {
    try {
      await GoogleSignIn.disconnectAsync();
      await GoogleSignIn.signOutAsync();
      console.log('Log out successful');
    } catch ({ message }) {
      console.error('Demo: Error: logout: ' + message);
    }

    this.setState({ user: null });
  };

  signInAsync = async () => {
    try {
      await GoogleSignIn.hasPlayServicesAsync();
      const { type, user } = await GoogleSignIn.signInAsync();
      console.log({ type, user });
      if (type === 'success') {
        this._syncUserWithStateAsync();
      }
    } catch ({ message }) {
      console.error('login: Error:' + message);
    }
  };

  render() {
    return <View />;
  }
}
```
