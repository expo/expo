import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Google } from 'expo';
import Button from '../components/Button';

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
        androidStandaloneAppClientId:
          '603386649315-87mbvgc739sec2gjtptl701ha62pi98p.apps.googleusercontent.com',
        androidClientId: '603386649315-9rbv8vmv2vvftetfbvlrbufcps1fajqf.apps.googleusercontent.com',
        iosStandaloneAppClientId:
          '603386649315-1b2o2gole94qc6h4prj6lvoiueq83se4.apps.googleusercontent.com',
        iosClientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
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
  };
}
