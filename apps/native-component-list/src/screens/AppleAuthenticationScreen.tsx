import React from 'react';
import { StyleSheet, View, Text, Button, Slider } from 'react-native';

import * as SignInWithApple from 'expo-apple-authentication';

interface State {
  isAvailable?: boolean;
  buttonStyle: SignInWithApple.SignInWithAppleButtonStyle;
  buttonType: SignInWithApple.SignInWithAppleButtonType;
  cornerRadius: number;
  credentials?: SignInWithApple.SignInWithAppleCredential;
}

export default class AppleAuthenticationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Apple Authentication',
  };

  readonly state: State = {
    buttonStyle: SignInWithApple.SignInWithAppleButtonStyle.White,
    buttonType: SignInWithApple.SignInWithAppleButtonType.SignIn,
    cornerRadius: 5,
  };

  componentDidMount() {
    this.checkAvailability();
  }

  checkAvailability = async () => {
    const isAvailable = await SignInWithApple.isAvailableAsync();
    this.setState({ isAvailable });
  }

  signIn = async () => {
    try {
      const credentials = await SignInWithApple.requestAsync({
        requestedScopes: [
          SignInWithApple.SignInWithAppleScope.FullName,
          SignInWithApple.SignInWithAppleScope.Email,
        ],
      });
      this.setState({ credentials })
    } catch (err) {
      console.error(err);
    }
  };

  checkCredentials = async () => {
    const result = SignInWithApple.getCredentialStateAsync(this.state.credentials!.user);
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
            <Button title="Check credentials" onPress={this.checkCredentials}/>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <SignInWithApple.SignInWithAppleButton
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
                title={`${SignInWithApple.SignInWithAppleButtonStyle[SignInWithApple.SignInWithAppleButtonStyle.White]}`}
                onPress={() => this.setState({ buttonStyle: SignInWithApple.SignInWithAppleButtonStyle.White })}
              />
              <Button
                title={`${SignInWithApple.SignInWithAppleButtonStyle[SignInWithApple.SignInWithAppleButtonStyle.WhiteOutline]}`}
                onPress={() => this.setState({ buttonStyle: SignInWithApple.SignInWithAppleButtonStyle.WhiteOutline })}
              />
              <Button
                title={`${SignInWithApple.SignInWithAppleButtonStyle[SignInWithApple.SignInWithAppleButtonStyle.Black]}`}
                onPress={() => this.setState({ buttonStyle: SignInWithApple.SignInWithAppleButtonStyle.Black })}
              />
            </View>
          </View><View style={styles.controlsContainer}>
            <Text style={styles.controlsText}>
              Button Type:
            </Text>
            <View style={styles.controlsButtonsContainer}>
              <Button
                title={`${SignInWithApple.SignInWithAppleButtonType[SignInWithApple.SignInWithAppleButtonType.SignIn]}`}
                onPress={() => this.setState({ buttonType: SignInWithApple.SignInWithAppleButtonType.SignIn })}
              />
              <Button
                title={`${SignInWithApple.SignInWithAppleButtonType[SignInWithApple.SignInWithAppleButtonType.Continue]}`}
                onPress={() => this.setState({ buttonType: SignInWithApple.SignInWithAppleButtonType.Continue })}
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
