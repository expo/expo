import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Subscription } from 'expo-modules-core';
import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import MonoText from '../components/MonoText';

const {
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
  AppleAuthenticationCredentialState,
  AppleAuthenticationScope,
} = AppleAuthentication;

type State = {
  isAvailable: boolean;
  buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle;
  buttonType: AppleAuthentication.AppleAuthenticationButtonType;
  cornerRadius: number;
  credentials?: AppleAuthentication.AppleAuthenticationCredential | null;
  credentialState: AppleAuthentication.AppleAuthenticationCredentialState | null;
};

const USER_CREDENTIAL_KEY = 'ExpoNativeComponentList/AppleAuthentication';

const CREDENTIAL_MESSAGES = {
  [AppleAuthenticationCredentialState.REVOKED]: 'Your authorization has been revoked.',
  [AppleAuthenticationCredentialState.AUTHORIZED]: "You're authorized.",
  [AppleAuthenticationCredentialState.NOT_FOUND]: "You're not registered yet.",
  [AppleAuthenticationCredentialState.TRANSFERRED]: 'Credentials transferred.', // Whatever that means...
};

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class AppleAuthenticationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Apple Authentication',
  };

  readonly state: State = {
    isAvailable: false,
    buttonStyle: AppleAuthenticationButtonStyle.WHITE,
    buttonType: AppleAuthenticationButtonType.SIGN_IN,
    cornerRadius: 5,
    credentials: null,
    credentialState: null,
  };

  _subscription?: Subscription;

  componentDidMount() {
    this.checkAvailability();
    this.checkCredentials();
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
  };

  checkAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    this.setState({ isAvailable });
  };

  signIn = async () => {
    try {
      const credentials = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthenticationScope.FULL_NAME, AppleAuthenticationScope.EMAIL],
        state: 'this-is-a-test',
      });
      this.setState({ credentials });
      if (credentials.user) {
        await AsyncStorage.setItem(USER_CREDENTIAL_KEY, credentials.user);
      }
      await this.checkCredentials();
    } catch (error) {
      alert(error);
    }
  };

  refresh = async () => {
    try {
      const credentials = await AppleAuthentication.refreshAsync({
        requestedScopes: [AppleAuthenticationScope.FULL_NAME, AppleAuthenticationScope.EMAIL],
        user: (await this.getUserIdentifier())!,
        state: 'this-is-a-test',
      });
      this.setState({ credentials });
      await this.checkCredentials();
    } catch (error) {
      alert(error);
    }
  };

  signOut = async () => {
    try {
      await AppleAuthentication.signOutAsync({
        user: (await this.getUserIdentifier())!,
        state: 'this-is-a-test',
      });
      this.setState({ credentials: null, credentialState: null });
    } catch (error) {
      alert(error);
    }
  };

  async checkCredentials() {
    try {
      const user = (await this.getUserIdentifier())!;
      const credentialState = await AppleAuthentication.getCredentialStateAsync(user);
      this.setState({ credentialState });
    } catch {
      // Obtaining a user or the credentials failed - fallback to not found.
      this.setState({ credentialState: AppleAuthenticationCredentialState.NOT_FOUND });
    }
  }

  async getUserIdentifier(): Promise<string | null> {
    return (
      this.state.credentials?.user ?? (await AsyncStorage.getItem(USER_CREDENTIAL_KEY)) ?? null
    );
  }

  isAuthorized(): boolean {
    return this.state.credentialState === AppleAuthenticationCredentialState.AUTHORIZED;
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
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.credentialStateContainer}>
          {this.state.credentialState && (
            <Text style={styles.credentialStateText}>
              {CREDENTIAL_MESSAGES[this.state.credentialState]}
            </Text>
          )}
        </View>
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
          <Text style={styles.controlsText}>Button Style:</Text>
          <View style={styles.controlsButtonsContainer}>
            <Button
              title={`${AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle.WHITE]}`}
              onPress={() => this.setState({ buttonStyle: AppleAuthenticationButtonStyle.WHITE })}
            />
            <Button
              title={`${
                AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle.WHITE_OUTLINE]
              }`}
              onPress={() =>
                this.setState({ buttonStyle: AppleAuthenticationButtonStyle.WHITE_OUTLINE })
              }
            />
            <Button
              title={`${AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle.BLACK]}`}
              onPress={() => this.setState({ buttonStyle: AppleAuthenticationButtonStyle.BLACK })}
            />
          </View>
        </View>
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsText}>Button Type:</Text>
          <View style={styles.controlsButtonsContainer}>
            <Button
              title={`${AppleAuthenticationButtonType[AppleAuthenticationButtonType.SIGN_IN]}`}
              onPress={() => this.setState({ buttonType: AppleAuthenticationButtonType.SIGN_IN })}
            />
            <Button
              title={`${AppleAuthenticationButtonType[AppleAuthenticationButtonType.CONTINUE]}`}
              onPress={() => this.setState({ buttonType: AppleAuthenticationButtonType.CONTINUE })}
            />
            <Button
              title={`${AppleAuthenticationButtonType[AppleAuthenticationButtonType.SIGN_UP]}`}
              onPress={() => this.setState({ buttonType: AppleAuthenticationButtonType.SIGN_UP })}
            />
          </View>
        </View>
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsText}>
            Button Corner Radius: {this.state.cornerRadius.toFixed(2)}
          </Text>
          <Slider
            minimumValue={0}
            maximumValue={20}
            value={this.state.cornerRadius}
            onValueChange={(cornerRadius) => this.setState({ cornerRadius })}
          />
        </View>
        {this.state.credentials && (
          <View>
            <Text>Credentials data:</Text>
            <MonoText>{JSON.stringify(this.state.credentials, null, 2)}</MonoText>
          </View>
        )}
        {this.isAuthorized() && (
          <View style={styles.credentialsContainer}>
            <Button title="Sign out" onPress={this.signOut} />
            <Button title="Refresh" onPress={this.refresh} />
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  scrollViewContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 15,
  },
  credentialStateContainer: {
    padding: 10,
  },
  credentialStateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlsContainer: {
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  controlsButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  credentialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
