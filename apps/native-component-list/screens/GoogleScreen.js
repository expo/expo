import { Google } from 'expo';
import React from 'react';
import { Alert, View } from 'react-native';

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
        clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
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
