import * as AppAuth from 'expo-app-auth';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Button, ScrollView, StyleSheet, Text, Platform } from 'react-native';

const GUID = '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9';
const config = {
  issuer: 'https://accounts.google.com',
  clientId: `${GUID}.apps.googleusercontent.com`,
  redirectUrl: Platform.select({ ios: 'host.exp.Exponent:/oauthredirect', android: undefined }),
  scopes: ['openid', 'profile'],
};

const StorageKey = 'StorageKey';

async function signInAsync() {
  const authState = await AppAuth.authAsync(config);
  await cacheAuthAsync(authState);
  console.log('signInAsync', authState);
  return authState;
}

async function refreshAuthAsync({ refreshToken }: { refreshToken: string }) {
  const authState = await AppAuth.refreshAsync(config, refreshToken);
  console.log('refresh', authState);
  await cacheAuthAsync(authState);
  return authState;
}

async function getCachedAuthAsync() {
  const value = await SecureStore.getItemAsync(StorageKey);
  const authState = JSON.parse(value!);
  console.log('getCachedAuthAsync', authState);
  if (authState) {
    if (checkIfTokenExpired(authState)) {
      return refreshAuthAsync(authState);
    } else {
      return authState;
    }
  }
}

async function cacheAuthAsync(authState: object) {
  return SecureStore.setItemAsync(StorageKey, JSON.stringify(authState));
}

function checkIfTokenExpired({ accessTokenExpirationDate }: { accessTokenExpirationDate: string }) {
  return new Date(accessTokenExpirationDate) < new Date();
}

async function signOutAsync({ accessToken }: { accessToken: string }) {
  try {
    await AppAuth.revokeAsync(config, {
      token: accessToken,
      isClientIdProvided: true,
    });
    await SecureStore.deleteItemAsync(StorageKey);
    return;
  } catch (error) {
    alert('Failed to revoke token: ' + error.message);
  }
}

interface State {
  authState?: any;
}

export default class AuthSessionScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'AuthSession',
  };

  readonly state: State = {};

  async componentDidMount() {
    this._getAuthAsync();

    // const response = await fetch(`${config.issuer}/.well-known/openid-configuration`);
    // const openidConfig = await response.json();
    // console.log('local try: ', openidConfig);
    try {
      const serviceConfig = await AppAuth.fetchServiceConfigAsync(config.issuer);
      console.log('Service Config: ', JSON.stringify(serviceConfig, null, 2));
    } catch (error) {
      console.log('Error getting service config: ', error, error.code);
    }
  }

  _getAuthAsync = async () => {
    try {
      const authState = await getCachedAuthAsync();
      this.setState({ authState });
    } catch ({ message }) {
      alert(message);
    }
  };

  _toggleAuthAsync = async () => {
    try {
      if (this.state.authState) {
        await signOutAsync(this.state.authState);
        this.setState({ authState: undefined });
      } else {
        const authState = await signInAsync();
        this.setState({ authState });
      }
    } catch ({ message }) {
      alert(message);
    }
  };

  get hasAuth() {
    return this.state.authState;
  }

  render() {
    const title = this.hasAuth ? 'Sign out' : 'Sign in';
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Button title={title} onPress={this._toggleAuthAsync} />
        {this.hasAuth && (
          <Button
            title="Refresh"
            onPress={async () => {
              const authState = await refreshAuthAsync(this.state.authState);
              this.setState({ authState });
            }}
          />
        )}
        {this.hasAuth ? (
          <Text style={styles.text}>Result: {JSON.stringify(this.state.authState, null, 2)}</Text>
        ) : null}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginVertical: 15,
    marginHorizontal: 10,
  },
  faintText: {
    color: '#888',
    marginHorizontal: 30,
  },
  oopsTitle: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
  },
  oopsText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
});
