import React from 'react';
import { Alert, View } from 'react-native';
import * as Google from 'expo-google-app-auth'

import Button from '../components/Button';

// bundle ID: host.exp.exponent
const IOS_KEY = '29635966244-v8mbqt2mtno71thelt7f2i6pob104f6e.apps.googleusercontent.com';
// bundle ID: app.json: expo.ios.bundleIdentifier
const IOS_STANDALONE_KEY =
  '29635966244-td9jmh1m5trn8uuqa0je1mansia76cln.apps.googleusercontent.com';
// package: host.exp.exponent
const ANDROID_CLIENT_KEY =
  '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2.apps.googleusercontent.com';
// package: app.json: expo.android.package
const ANDROID_STANDALONE_KEY =
  '29635966244-eql85q7fpnjncjcp6o3t3n98mgeeklc9.apps.googleusercontent.com';

export default class GoogleLoginScreen extends React.Component {
  static navigationOptions = {
    title: 'Google',
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={() => this._testGoogleLogin()} title="Authenticate with Google" />
      </View>
    );
  }

  _testGoogleLogin = async () => {
    try {
      const result = await Google.logInAsync({
        clientId: IOS_KEY,
        iosClientId: IOS_KEY,
        iosStandaloneAppClientId: IOS_STANDALONE_KEY,
        androidClientId: ANDROID_CLIENT_KEY,
        androidStandaloneAppClientId: ANDROID_STANDALONE_KEY,
      });

      const { type } = result;

      if (type === 'success') {
        // Avoid race condition with the WebView hiding when using web-based sign in
        setTimeout(() => {
          Alert.alert('Logged in!', JSON.stringify(result), [
            {
              text: 'OK!',
              onPress: () => {
                console.log({ result });
              },
            },
          ]);
        }, 1000);
      }
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK :(', onPress: () => {} }]);
    }
  }
}
