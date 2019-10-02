import React from 'react';
import { Alert, ScrollView } from 'react-native';
import * as Facebook from 'expo-facebook';
import ListButton from '../components/ListButton';

export default class FacebookLoginScreen extends React.Component {
  static navigationOptions = {
    title: 'FacebookLogin',
  };

  render() {
    const permissions = ['public_profile', 'email', 'user_friends'];

    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={() => this._testFacebookLogin('1201211719949057', permissions)}
          title="Authenticate with Facebook"
        />
      </ScrollView>
    );
  }

  _testFacebookLogin = async (id: string, perms: string[]) => {
    try {
      const result = await Facebook.logInWithReadPermissionsAsync(id, {
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
