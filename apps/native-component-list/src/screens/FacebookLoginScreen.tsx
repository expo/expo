import * as Facebook from 'expo-facebook';
import React from 'react';
import { Alert, Platform, ScrollView } from 'react-native';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import SimpleActionDemo from '../components/SimpleActionDemo';

const appId = '1696089354000816';

export default class FacebookLoginScreen extends React.Component {
  static navigationOptions = {
    title: 'FacebookLogin',
  };

  state = {
    user: null,
  };

  render() {
    const permissions = ['public_profile', 'email'];

    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={async () =>
            await Facebook.initializeAsync({ appId, version: Platform.select({ web: 'v5.0' }) })
          }
          title="Initialize Facebook SDK"
        />
        <SimpleActionDemo
          title="get tracking permissions"
          action={async () => await Facebook.getPermissionsAsync()}
        />
        <SimpleActionDemo
          title="request tracking permissions"
          action={async () => await Facebook.requestPermissionsAsync()}
        />
        <ListButton
          onPress={async () => await Facebook.setAutoInitEnabledAsync(true)}
          title="Set autoinit to true (should show deprecation warning)"
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
      Alert.alert(
        'Error!',
        `It is possible that you are not included in the Facebook test app (id: ${appId}).\n\nRaw Message: ${e.message}.`,
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  };
}
