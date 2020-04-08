import * as AuthSession from 'expo-auth-session';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const auth0Domain = 'https://fake-auth.netlify.com';

/**
 * Converts an object to a query string.
 */
function toQueryString(params: object) {
  return (
    '?' +
    Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  );
}

interface State {
  result?: any;
}

export default class AuthSessionScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'AuthSession',
  };

  readonly state: State = {};

  render() {
    return (
      <View style={styles.container}>
        <Button title="Authenticate using an external service" onPress={this._handlePressAsync} />
        {this.state.result ? (
          <Text style={styles.text}>Result: {JSON.stringify(this.state.result)}</Text>
        ) : null}
      </View>
    );
  }

  _handlePressAsync = async () => {
    const redirectUrl = AuthSession.getRedirectUrl('redirect');
    const authUrl =
      `${auth0Domain}` +
      toQueryString({
        response_type: 'token',
        scope: 'openid name',
        redirect_uri: redirectUrl,
      });

    const result = await AuthSession.startAsync({
      authUrl,
      returnUrl: redirectUrl,
    });
    this.setState({ result });
  };
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
