import * as AppAuth from 'expo-app-auth';
import React from 'react';
import { AsyncStorage, Button, StyleSheet, Text, View } from 'react-native';

import { getGUID } from '../api/guid';

function getConfig() {
  return {
    issuer: 'https://accounts.google.com',
    clientId: `${getGUID()}.apps.googleusercontent.com`,
    scopes: ['openid', 'profile'],
  };
}

const StorageKey = '@Storage:Key';

async function signInAsync() {
  const authState = await AppAuth.authAsync(getConfig());
  await cacheAuthAsync(authState);
  console.log('signInAsync', authState);
  return authState;
}

async function refreshAuthAsync({ refreshToken }: { refreshToken: string }) {
  const authState = await AppAuth.refreshAsync(getConfig(), refreshToken);
  console.log('refresh', authState);
  await cacheAuthAsync(authState);
  return authState;
}

async function getCachedAuthAsync() {
  const value = await AsyncStorage.getItem(StorageKey);
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
  return AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
}

function checkIfTokenExpired({ accessTokenExpirationDate }: { accessTokenExpirationDate: string }) {
  return new Date(accessTokenExpirationDate) < new Date();
}

async function signOutAsync({ accessToken }: { accessToken: string }) {
  try {
    await AppAuth.revokeAsync(getConfig(), {
      token: accessToken,
      isClientIdProvided: true,
    });
    await AsyncStorage.removeItem(StorageKey);
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

  componentDidMount() {
    this._getAuthAsync();
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
      <View style={styles.container}>
        <Button title={title} onPress={this._toggleAuthAsync} />
        {this.hasAuth ? (
          <Text style={styles.text}>
            Result: {JSON.stringify(this.state.authState).slice(0, 50)}
          </Text>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
