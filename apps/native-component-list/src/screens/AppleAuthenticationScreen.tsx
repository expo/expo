import React from 'react';
import { Alert, StyleSheet, View, Text, Button, Slider } from 'react-native';
import { Subscription } from '@unimodules/core';

import * as AppleAuthentication from 'expo-apple-authentication';

type State = {
  isAvailable: boolean;
  buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle;
  buttonType: AppleAuthentication.AppleAuthenticationButtonType;
  cornerRadius: number;
  credentials: AppleAuthentication.AppleAuthenticationCredential | null;
}

export default class AppleAuthenticationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Apple Authentication',
  };

  readonly state: State = {
    isAvailable: false,
    buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle.WHITE,
    buttonType: AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
    cornerRadius: 5,
    credentials: null,
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

  signIn = async () => {
    try {
      const credentials = await AppleAuthentication.loginAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state: 'this-is-a-test',
      });
      if (credentials.type === 'success') {
        this.setState({ credentials });
      }
    } catch (err) {
      console.error(err);
    }
  }

  refresh = async () => {
    try {
      const credentials = await AppleAuthentication.refreshAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        user: this.state.credentials!.user!,
        state: 'this-is-a-test',
      });
      if (credentials.type === 'success') {
        this.setState({ credentials });
      }
    } catch (err) {
      console.error(err);
    }
  }

  signOut = async () => {
    try {
      const credentials = await AppleAuthentication.logoutAsync({
        user: this.state.credentials!.user!,
        state: 'this-is-a-test',
      });
      if (credentials.type === 'success') {
        this.setState({ credentials });
      }
    } catch (err) {
      console.error(err);
    }
  }

  checkCredentials = async () => {
    if (this.state.credentials && this.state.credentials.user) {
      const credentialState = await AppleAuthentication.getCredentialStateAsync(this.state.credentials.user);
      const alertMessages = {
        [AppleAuthentication.AppleAuthenticationCredentialState.REVOKED]: 'Your authorization has been revoked.',
        [AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED]: 'You\'re authorized.',
        [AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND]: 'You\'re not registered yet.',
        [AppleAuthentication.AppleAuthenticationCredentialState.TRANSFERRED]: 'Credentials transferred.', // Whatever that means...
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
          <AppleAuthentication.AppleAuthenticationButton
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
                title={`${AppleAuthentication.AppleAuthenticationButtonStyle[AppleAuthentication.AppleAuthenticationButtonStyle.WHITE]}`}
                onPress={() => this.setState({ buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle.WHITE })}
              />
              <Button
                title={`${AppleAuthentication.AppleAuthenticationButtonStyle[AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE]}`}
                onPress={() => this.setState({ buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE })}
              />
              <Button
                title={`${AppleAuthentication.AppleAuthenticationButtonStyle[AppleAuthentication.AppleAuthenticationButtonStyle.BLACK]}`}
                onPress={() => this.setState({ buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle.BLACK })}
              />
            </View>
          </View><View style={styles.controlsContainer}>
            <Text style={styles.controlsText}>
              Button Type:
            </Text>
            <View style={styles.controlsButtonsContainer}>
              <Button
                title={`${AppleAuthentication.AppleAuthenticationButtonType[AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN]}`}
                onPress={() => this.setState({ buttonType: AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN })}
              />
              <Button
                title={`${AppleAuthentication.AppleAuthenticationButtonType[AppleAuthentication.AppleAuthenticationButtonType.CONTINUE]}`}
                onPress={() => this.setState({ buttonType: AppleAuthentication.AppleAuthenticationButtonType.CONTINUE })}
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
