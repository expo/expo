# expo-firebase-auth

`expo-firebase-auth` provides a comprehensive set of tools for authenticating users.

[**Full documentation**](https://rnfirebase.io/docs/master/auth/reference/auth)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-auth` or `yarn add expo-firebase-auth`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseAuth', path: '../node_modules/expo-firebase-auth/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-auth'
    project(':expo-firebase-auth').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-auth/android')
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
    compile project(':expo-firebase-auth')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now include the package in React Native.](https://rnfirebase.io/docs/master/auth/android#Install-the-RNFirebase-Authentication-package)

## Usage

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import firebase from 'expo-firebase-app';
import { Facebook } from 'expo';
// Include the module before using it.
import 'expo-firebase-auth';
// API can be accessed with: firebase.auth();

// IMPORTANT: Remember to enable the facebook auth in the firebase console!

export default class DemoView extends React.Component {
  state = { user: null };

  componentDidMount() {
    // List to the authentication state
    this._unsubscribe = firebase.auth().onAuthStateChanged(this.onAuthStateChanged);
  }

  componentWillUnmount() {
    // Clean up: remove the listener
    this._unsubscribe();
  }

  onAuthStateChanged = user => {
    // if the user logs in or out, this will be called and the state will update.
    // This value can also be accessed via: firebase.auth().currentUser
    this.setState({ user });
  };

  async facebookLogin() {
    // Get an API Key from https://developers.facebook.com/ (it's pretty easy)
    const authData = await Facebook.logInWithReadPermissionsAsync(FacebookApiKey);
    if (!authData) return;
    const { type, token } = authData;
    if (type === 'success') {
      return token;
    } else {
      // Maybe the user cancelled...
    }
  }

  loginAsync = async () => {
    // First we login to facebook and get an "Auth Token" then we use that token to create an account or login. This concept can be applied to github, twitter, google, ect...
    const token = await this.facebookLogin();
    if (!token) return;
    // Use the facebook token to authenticate our user in firebase.
    const credential = firebase.auth.FacebookAuthProvider.credential(token);
    try {
      // login with credential
      await firebase.auth().signInAndRetrieveDataWithCredential(credential);
    } catch ({ message }) {
      alert(message);
    }
  };

  async logoutAsync() {
    try {
      await firebase.auth().signOut();
    } catch ({ message }) {
      alert(message);
    }
  }

  toggleAuth = () => {
    if (!!this.state.user) {
      this.logoutAsync();
    } else {
      this.loginAsync();
    }
  };

  render() {
    const { user } = this.state;
    const message = !!user ? 'Logout' : 'Login';
    return (
      <View style={{ flex: 1 }}>
        <Text onPress={this.toggleAuth}>{message}</Text>
      </View>
    );
  }
}
```
