/* @flow */

import React from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { connect } from 'react-redux';

import AuthTokenActions from '../../Flux/AuthTokenActions';

import Analytics from '../../Api/Analytics';
import Alerts from '../constants/Alerts';
import Auth0Api from '../../Api/Auth0Api';
import Colors from '../constants/Colors';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';

const DEBUG = false;

@connect(data => SignUpScreen.getDataProps(data))
export default class SignUpScreen extends React.Component {
  static route = {
    navigationBar: {
      title: 'Sign Up',
    },
  };

  static getDataProps(data) {
    return {
      authTokens: data.authTokens,
    };
  }

  state = DEBUG
    ? {
        keyboardHeight: 0,
        firstName: 'Brent',
        lastName: 'Vatne',
        username: `brentvatne${new Date() - 0}`,
        email: `brentvatne+${new Date() - 0}@gmail.com`,
        password: 'pass123!!!1',
        passwordConfirmation: 'pass123!!!1',
        isLoading: false,
      }
    : {
        keyboardHeight: 0,
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        isLoading: false,
      };

  componentWillReceiveProps(nextProps) {
    if (nextProps.authTokens.idToken && !this.props.authTokens.isToken) {
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedField());
      this.props.navigation.dismissModal();
    }
  }

  componentDidMount() {
    this._isMounted = true;

    this._keyboardDidShowSubscription = Keyboard.addListener(
      'keyboardDidShow',
      ({ endCoordinates }) => {
        const keyboardHeight = endCoordinates.height;
        this.setState({ keyboardHeight });
      }
    );

    this._keyboardDidHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        this.setState({ keyboardHeight: 0 });
      }
    );
  }

  componentWillUnmount() {
    this._isMounted = false;

    this._keyboardDidShowSubscription.remove();
    this._keyboardDidHideSubscription.remove();
  }

  render() {
    return (
      <ScrollView
        contentContainerStyle={{ paddingTop: 20 }}
        keyboardShouldPersistTaps="always"
        style={styles.container}>
        <Form>
          <Form.Input
            onChangeText={this._updateValue.bind(this, 'firstName')}
            onSubmitEditing={() => this._handleSubmitEditing('firstName')}
            value={this.state.firstName}
            autofocus
            autoCorrect={false}
            autoCapitalize="words"
            blurOnSubmit={false}
            keyboardType="default"
            label="First name"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this._lastNameInput = view;
            }}
            onChangeText={this._updateValue.bind(this, 'lastName')}
            onSubmitEditing={() => this._handleSubmitEditing('lastName')}
            value={this.state.lastName}
            autoCorrect={false}
            autoCapitalize="words"
            blurOnSubmit={false}
            keyboardType="default"
            label="Last name"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this._usernameInput = view;
            }}
            onChangeText={this._updateValue.bind(this, 'username')}
            onSubmitEditing={() => this._handleSubmitEditing('username')}
            value={this.state.username}
            autoCorrect={false}
            autoCapitalize="none"
            blurOnSubmit={false}
            keyboardType="default"
            label="Username"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this._emailInput = view;
            }}
            onSubmitEditing={() => this._handleSubmitEditing('email')}
            onChangeText={this._updateValue.bind(this, 'email')}
            autoCorrect={false}
            autoCapitalize="none"
            value={this.state.email}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            keyboardType="email-address"
            label="E-mail address"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this._passwordInput = view;
            }}
            onSubmitEditing={() => this._handleSubmitEditing('password')}
            onChangeText={this._updateValue.bind(this, 'password')}
            value={this.state.password}
            autoCorrect={false}
            autoCapitalize="none"
            label="Password"
            returnKeyType="next"
            secureTextEntry
          />
          <Form.Input
            ref={view => {
              this._passwordConfirmationInput = view;
            }}
            onSubmitEditing={() =>
              this._handleSubmitEditing('passwordConfirmation')}
            onChangeText={this._updateValue.bind(this, 'passwordConfirmation')}
            value={this.state.passwordConfirmation}
            hideBottomBorder
            autoCorrect={false}
            autoCapitalize="none"
            label="Repeat your password"
            returnKeyType="done"
            secureTextEntry
          />
        </Form>

        <PrimaryButton
          style={{ margin: 20 }}
          onPress={this._handleSubmit}
          isLoading={this.state.isLoading}>
          Sign Up
        </PrimaryButton>

        <View style={{ height: this.state.keyboardHeight }} />
      </ScrollView>
    );
  }

  _handleSubmitEditing = field => {
    switch (field) {
      case 'firstName':
        this._lastNameInput.focus();
        break;
      case 'lastName':
        this._usernameInput.focus();
        break;
      case 'username':
        this._emailInput.focus();
        break;
      case 'email':
        this._passwordInput.focus();
        break;
      case 'password':
        this._passwordConfirmationInput.focus();
        break;
      case 'passwordConfirmation':
        this._handleSubmit();
        break;
    }
  };

  _updateValue = (key, value) => {
    this.setState({ [key]: value });
  };

  _handleSubmit = async () => {
    let { isLoading } = this.state;

    if (isLoading) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      let signUpResult = await Auth0Api.signUpAsync(this.state);

      if (signUpResult.errors) {
        this._isMounted && this._handleError(signUpResult);
        return;
      }

      Analytics.track(Analytics.events.USER_CREATED_ACCOUNT, { github: false });

      let signInResult = await Auth0Api.signInAsync(
        this.state.email,
        this.state.password
      );

      if (this._isMounted) {
        if (signInResult.error) {
          this._handleError(signInResult);
        } else {
          this.props.navigator.hideLocalAlert();
          this.props.dispatch(
            AuthTokenActions.setAuthTokens({
              refreshToken: signInResult.refresh_token,
              accessToken: signInResult.access_token,
              idToken: signInResult.id_token,
            })
          );
        }
      }
    } catch (e) {
      this._isMounted && this._handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  };

  _handleError = result => {
    // Our signup endpoint has this format for result object if there is an error:
    // {
    //  "errors":[
    //    {
    //      "code":"AUTHENTICATION_ERROR",
    //      "message":"Error creating user.",
    //      "details":{
    //        "statusCode":400,
    //        "error":"Bad Request",
    //        "message":"The user already exists (username: notbrent).",
    //        "errorCode":"auth0_idp_error"
    //      }
    //    }
    //  ]
    // }

    let message = 'Sorry, something went wrong.';
    if (result.errors) {
      let { details } = result.errors[0];
      message = details.message;
    } else if (result.error_description || result.message) {
      message = result.error_description || result.message;
    } else {
      message = 'Sorry, something went wrong.';
    }

    this.props.navigator.showLocalAlert(message, Alerts.error);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
});
