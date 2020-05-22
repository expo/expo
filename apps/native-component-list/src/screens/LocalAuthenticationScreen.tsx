import React from 'react';
import { Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Button from '../components/Button';

interface State {
  waiting: boolean;
  hasHardware?: boolean;
  isEnrolled?: boolean;
}

export default class LocalAuthenticationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'LocalAuthentication',
  };

  readonly state: State = {
    waiting: false,
  };

  componentDidMount() {
    this.checkDevicePossibilities();
  }

  async checkDevicePossibilities() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    this.setState({ hasHardware, isEnrolled });
  }

  authenticate = async () => {
    this.setState({ waiting: true });
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate',
        cancelLabel: 'Cancel label',
        disableDeviceFallback: true,
      });
      if (result.success) {
        alert('Authenticated!');
      } else {
        alert('Failed to authenticate, reason: ' + result.error);
      }
    } finally {
      this.setState({ waiting: false });
    }
  };

  checkAuthenticationsTypes = async () => {
    const result = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const stringResult = result
      .map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'FINGERPRINT';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'FACIAL_RECOGNITION';
          default:
            throw new Error(`Unrecognised authentication type returned: '${type}'`);
        }
      })
      .join(', ');
    alert(stringResult ? `Available types: ${stringResult}` : 'No available authentication types!');
  };

  render() {
    const { hasHardware, isEnrolled } = this.state;

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ paddingBottom: 30 }}>
          <Text>
            LocalAuthentication.hasHardwareAsync():
            <Text style={{ fontWeight: 'bold' }}>{` ${hasHardware}`}</Text>
          </Text>
          <Text>
            LocalAuthentication.isEnrolledAsync():
            <Text style={{ fontWeight: 'bold' }}>{` ${isEnrolled}`}</Text>
          </Text>
        </View>
        <Button
          style={{ margin: 5 }}
          onPress={this.authenticate}
          title={this.state.waiting ? 'Waiting for authentication... ' : 'Authenticate'}
        />
        <Button
          style={{ margin: 5 }}
          onPress={this.checkAuthenticationsTypes}
          title="Check available authentications types"
        />
      </View>
    );
  }
}
