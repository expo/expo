import React from 'react';
import { Alert, ScrollView } from 'react-native';
import * as Facebook from 'expo-facebook';
import ListButton from '../components/ListButton';

const appId = '1201211719949057';

export default class FacebookLoginScreen extends React.Component {
  static navigationOptions = {
    title: 'FacebookLogin',
  };

  render() {
    const permissions = ['public_profile', 'email', 'user_friends'];

    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={async () => await Facebook.initializeAsync(appId)}
          title="Initialize Facebook SDK"
        />
        <ListButton
          onPress={async () => await Facebook.setAutoInitEnabledAsync(true)}
          title="Set autoinit to true"
        />
        <ListButton
          onPress={async () => await Facebook.setAutoInitEnabledAsync(false)}
          title="Set autoinit to false"
        />
        <ListButton
          onPress={() => this._testFacebookLogin(permissions)}
          title="Authenticate with Facebook"
        />
      </ScrollView>
    );
  }

  _testFacebookLogin = async (perms: string[]) => {
    try {
      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: perms,
      });

      const { type, token } = result;

      if (type === 'success') {
        Alert.alert('Logged in!', JSON.stringify(result), [
          {
            text: 'OK!',
            onPress: () => {
              console.log({ type, token });
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };
}
