import * as Facebook from 'expo-facebook';
import React from 'react';
import { Alert, Platform, ScrollView } from 'react-native';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

const appId = '1201211719949057';

export default class FacebookLoginScreen extends React.Component {
  static navigationOptions = {
    title: 'FacebookLogin',
  };

  state = {
    user: null,
  };

  render() {
    const permissions = ['public_profile', 'email', 'user_friends'];

    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={async () =>
            await Facebook.initializeAsync({ appId, version: Platform.select({ web: 'v5.0' }) })
          }
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
        <ListButton onPress={() => Facebook.logOutAsync()} title="Log out of Facebook" />
        <ListButton
          onPress={async () =>
            this.setState({ user: await Facebook.getAuthenticationCredentialAsync() })
          }
          title="Get Access Token"
        />
        {this.state.user && <MonoText>{JSON.stringify(this.state.user, null, 2)}</MonoText>}
      </ScrollView>
    );
  }

  _testFacebookLogin = async (perms: string[]) => {
    try {
      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: perms,
      });

      if (result.type === 'success') {
        Alert.alert('Logged in!', JSON.stringify(result), [
          {
            text: 'OK!',
            onPress: () => {
              console.log({ type: result.type, token: result.token });
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };
}
