import React from 'react';
import { Alert, StyleSheet, View, Text, Button, Slider } from 'react-native';
import { Subscription } from '@unimodules/core';

import * as AppleAuthentication from 'expo-apple-authentication';

interface State {
  isAvailable?: boolean;
  buttonStyle: AppleAuthentication.ButtonStyle;
  buttonType: AppleAuthentication.ButtonType;
  cornerRadius: number;
  credentials?: AppleAuthentication.Credential | null;
}

export default class AppleAuthenticationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Apple Authentication',
  };

  readonly state: State = {
    buttonStyle: AppleAuthentication.ButtonStyle.White,
    buttonType: AppleAuthentication.ButtonType.SignIn,
    cornerRadius: 5,
  };

  _subscription?: Subscription;

  componentDidMount() {
    this.checkAvailability();
    this._subscription = AppleAuthentication.addRevokeListener(this.revokeListener);
  }

  componentWillUnmount() {
    if (this._subscription) {
      this._subscription.remove();
    }
  }

  revokeListener = () => {
    this.setState({ credentials: null });
    Alert.alert('Credentials revoked!');
  }

  checkAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    this.setState({ isAvailable });
  }

  request = async (operation: AppleAuthentication.Operation) => {
    try {
      const credentials = await AppleAuthentication.requestAsync({
        requestedScopes: [
          AppleAuthentication.Scope.FullName,
          AppleAuthentication.Scope.Email,
        ],
        requestedOperation: operation,
        user: this.state.credentials && this.state.credentials.user ? this.state.credentials.user : undefined,
        state: 'this-is-a-test',
      });
      if (credentials.type === 'success') {
        this.setState({ credentials });
      }
    } catch (err) {
      console.error(err);
    }
  };

  signIn = async () => {
    await this.request(AppleAuthentication.Operation.Login);
  }

  refresh = async () => {
    await this.request(AppleAuthentication.Operation.Refresh);
  }

  signOut = async () => {
    await this.request(AppleAuthentication.Operation.Logout);
  }

  checkCredentials = async () => {
    if (this.state.credentials && this.state.credentials.user) {
      const credentialState = await AppleAuthentication.getCredentialStateAsync(this.state.credentials.user);
      const alertMessages = {
        [AppleAuthentication.CredentialState.Revoked]: 'Your authorization has been revoked.',
        [AppleAuthentication.CredentialState.Authorized]: 'You\'re authorized.',
        [AppleAuthentication.CredentialState.NotFound]: 'You\'re not registered yet.',
        [AppleAuthentication.CredentialState.Transferred]: 'Credentials transferred.', // Whatever that means...
      };
      alert(alertMessages[credentialState]);
    }
  }

  render() {
    if (this.state.isAvailable === undefined) {
      return (
        <View style={styles.container}>
          <Text>Checking availability ...</Text>
        </View>
      );
    }

    if (!this.state.isAvailable) {
      return (
        <View style={styles.container}>
          <Text>SignIn with Apple is not available</Text>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        {this.state.credentials && (
          <View style={styles.checkCredentialsContainer}>
            <Button title="Check credentials" onPress={this.checkCredentials} />
            <Button title="Refresh" onPress={this.refresh} />
            <Button title="Sign out" onPress={this.signOut} />
          </View>
        )}
        <View style={styles.buttonContainer}>
          <AppleAuthentication.SignInWithAppleButton
            buttonStyle={this.state.buttonStyle}
            buttonType={this.state.buttonType}
            cornerRadius={this.state.cornerRadius}
            onPress={this.signIn}
            style={{ width: 250, height: 44, margin: 15 }}
          />
        </View>
        <View style={styles.controlsContainer}>
          <View style={styles.controlsContainer}>
            <Text style={styles.controlsText}>
              Button Style:
            </Text>
            <View style={styles.controlsButtonsContainer}>
              <Button
                title={`${AppleAuthentication.ButtonStyle[AppleAuthentication.ButtonStyle.White]}`}
                onPress={() => this.setState({ buttonStyle: AppleAuthentication.ButtonStyle.White })}
              />
              <Button
                title={`${AppleAuthentication.ButtonStyle[AppleAuthentication.ButtonStyle.WhiteOutline]}`}
                onPress={() => this.setState({ buttonStyle: AppleAuthentication.ButtonStyle.WhiteOutline })}
              />
              <Button
                title={`${AppleAuthentication.ButtonStyle[AppleAuthentication.ButtonStyle.Black]}`}
                onPress={() => this.setState({ buttonStyle: AppleAuthentication.ButtonStyle.Black })}
              />
            </View>
          </View><View style={styles.controlsContainer}>
            <Text style={styles.controlsText}>
              Button Type:
            </Text>
            <View style={styles.controlsButtonsContainer}>
              <Button
                title={`${AppleAuthentication.ButtonType[AppleAuthentication.ButtonType.SignIn]}`}
                onPress={() => this.setState({ buttonType: AppleAuthentication.ButtonType.SignIn })}
              />
              <Button
                title={`${AppleAuthentication.ButtonType[AppleAuthentication.ButtonType.Continue]}`}
                onPress={() => this.setState({ buttonType: AppleAuthentication.ButtonType.Continue })}
              />
            </View>
          </View>
          <View style={styles.controlsContainer}>
            <Text style={styles.controlsText}>
              Button Corner Radius: {this.state.cornerRadius.toFixed(2)}
            </Text>
            <Slider minimumValue={0} maximumValue={20} value={this.state.cornerRadius} onValueChange={cornerRadius => this.setState({ cornerRadius })} />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 50, 50, 0.5)',
    marginBottom: 20,
  },
  controlsContainer: {
    marginBottom: 10,
  },
  controlsButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlsText: {
    fontSize: 16,
  },
  checkCredentialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
