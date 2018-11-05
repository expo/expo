import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthSession, Constants } from 'expo';

const auth0ClientId = '8wmGum25h3KU2grnmZtFvMQeitmIdSDS';
const auth0Domain = 'https://expo-testing.auth0.com';

/**
 * Converts an object to a query string.
 */
function toQueryString(params) {
  return (
    '?' +
    Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  );
}

export default class AuthSessionScreen extends React.Component {
  static navigationOptions = {
    title: 'AuthSession',
  };

  state = {
    result: null,
    invalidExperienceId: Constants.manifest.id !== '@community/native-component-list',
  };

  render() {
    if (this.state.invalidExperienceId) {
      return (
        <View style={styles.container}>
          <Text style={styles.oopsTitle}>Hello, developer person!</Text>
          <Text style={styles.oopsText}>
            The experience id {Constants.manifest.id} will not work with this due to the authorized
            callback URL configuration on Auth0{' '}
          </Text>
          <Text style={styles.oopsText}>
            Sign in as @community to use this example, or change the Auth0 client id and domain in
            AuthSessionScreen.js
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Button title="Authenticate using an external service" onPress={this._handlePressAsync} />
        {this.state.result ? (
          <Text style={styles.text}>Result: {JSON.stringify(this.state.result)}</Text>
        ) : null}
        <Text style={styles.faintText}>{AuthSession.getDefaultReturnUrl()}</Text>
      </View>
    );
  }

  _handlePressAsync = async () => {
    let redirectUrl = AuthSession.getRedirectUrl();
    let authUrl =
      `${auth0Domain}/authorize` +
      toQueryString({
        client_id: auth0ClientId,
        response_type: 'token',
        scope: 'openid name',
        redirect_uri: redirectUrl,
      });

    let result = await AuthSession.startAsync({ authUrl });
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
