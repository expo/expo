import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  connect,
} from 'react-redux';

import Alerts from '../constants/Alerts';
import Actions from '../state/actions';
import Auth0Api from '../api/Auth0Api';
import Colors from '../constants/Colors';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';

@connect(data => SignUpScreen.getDataProps(data))
export default class SignUpScreen extends React.Component {
  static route = {
    navigationBar: {
      title: 'Sign Up',
    },
  }

  static getDataProps(data) {
    return {
      authTokens: data.authTokens,
    };
  }

  state = {
    firstName: 'Brent',
    lastName: 'Vatne',
    username: `brentvatne${(new Date() - 0)}`,
    email: `brentvatne+${(new Date() - 0)}@gmail.com`,
    password: 'pass123!!!1',
    passwordConfirmation: 'pass123!!!1',
    isLoading: false,
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.authTokens && !this.props.authTokens) {
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedField());
      this.props.navigation.dismissModal();
    }
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <ScrollView
        contentContainerStyle={{paddingTop: 20}}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps
        style={styles.container}>
        <Form>
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'firstName')}
            value={this.state.firstName}
            autofocus
            blurOnSubmit={false}
            keyboardType="default"
            label="First name"
            returnKeyType="next"
          />
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'lastName')}
            value={this.state.lastName}
            blurOnSubmit={false}
            keyboardType="default"
            label="Last name"
            returnKeyType="next"
          />
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'username')}
            value={this.state.username}
            blurOnSubmit={false}
            keyboardType="default"
            label="Username"
            returnKeyType="next"
          />
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'email')}
            value={this.state.email}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            keyboardType="email-address"
            label="E-mail address"
            returnKeyType="next"
          />
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'password')}
            value={this.state.password}
            label="Password"
            returnKeyType="next"
            secureTextEntry
          />
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'passwordConfirmation')}
            value={this.state.passwordConfirmation}
            hideBottomBorder
            label="Repeat your password"
            returnKeyType="done"
            secureTextEntry
          />
        </Form>

        <PrimaryButton
          style={{margin: 20}}
          onPress={this._handleSubmit}
          isLoading={this.state.isLoading}>
          Sign Up
        </PrimaryButton>
      </ScrollView>
    );
  }

  _updateValue = (key, value) => {
    this.setState({[key]: value});
  }

  _handleSubmit = async () => {
    let { isLoading } = this.state;

    if (isLoading) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      let signUpResult = await Auth0Api.signUpAsync(this.state);

      // What's the failure case here?
      if (!signUpResult || !signUpResult.data || !signUpResult.data.user.user_id) {
        this._isMounted && this._handleError(signUpResult);
        return;
      }

      let signInResult = await Auth0Api.signInAsync(
        this.state.email,
        this.state.password
      );

      if (this._isMounted) {
        if (signInResult.error) {
          this._handleError(signInResult);
        } else {
          this.props.navigator.hideLocalAlert();
          this.props.dispatch(Actions.setAuthTokens({
            refreshToken: signInResult.refresh_token,
            accessToken: signInResult.access_token,
            idToken: signInResult.id_token,
          }));
        }
      }
    } catch(e) {
      this._isMounted && this._handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  }

  _handleError = (error) => {
    console.log({error});
    let message = error.error_description || error.message || "Sorry, something went wrong.";
    this.props.navigator.showLocalAlert(message, Alerts.error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
});
