/* @flow */

import React from 'react';
import { Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { connect } from 'react-redux';

import SessionActions from '../redux/SessionActions';

import Analytics from '../api/Analytics';
import Alerts from '../constants/Alerts';
import Auth0Api from '../api/Auth0Api';
import CloseButton from '../components/CloseButton';
import Colors from '../constants/Colors';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';

const DEBUG = false;

@connect(data => SignUpScreen.getDataProps(data))
export default class SignUpScreen extends React.Component {
  static navigationOptions = {
    title: 'Sign Up',
    headerLeft: <CloseButton />,
  };

  static getDataProps(data) {
    return {
      session: data.session,
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

  _isMounted: boolean;
  _keyboardDidShowSubscription: { remove: Function };
  _keyboardDidHideSubscription: { remove: Function };

  componentWillReceiveProps(nextProps: Object) {
    if (nextProps.session.sessionSecret && !this.props.session.sessionSecret) {
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedField());
      this.props.navigation.pop();
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

    this._keyboardDidHideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      this.setState({ keyboardHeight: 0 });
    });
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
            autoFocus
            autoCorrect={false}
            autoCapitalize="words"
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
            onSubmitEditing={() => this._handleSubmitEditing('passwordConfirmation')}
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

  _lastNameInput: any;
  _usernameInput: any;
  _emailInput: any;
  _passwordInput: any;
  _passwordConfirmationInput: any;

  _handleSubmitEditing = (field: string) => {
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

  _updateValue = (key: string, value: string) => {
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

      let signInResult = await Auth0Api.signInAsync(this.state.email, this.state.password);

      if (this._isMounted) {
        if (signInResult.error) {
          this._handleError(signInResult);
        } else {
          this.props.dispatch(
            SessionActions.setSession({ sessionSecret: signInResult.sessionSecret })
          );
        }
      }
    } catch (e) {
      this._isMounted && this._handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  };

  _handleError = (result: any) => {
    // Our signup endpoint has this format for result object if there
    // is an error:
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
    //
    // NOTE(jim): On September 20th 2017, ben helped me discover that
    // some messages were not returning 'details', but just a message.
    // therefore I performed a hotfix for the following shape.
    //
    // { errors:
    //  [
    //    {
    //      code: 'API_ERROR',
    //      message: 'Please provide us with a username.'
    //    }
    //  ]
    // }
    //
    // TODO(jim) Since I am inheriting the maintenance of these
    // endpoints, It would be reasonable to take some spare time to
    // make sure the shape of all errors are consistent for all clients.

    let errorMessage = 'Sorry, something went wrong.';
    if (result.errors) {
      const { details, message } = result.errors[0];
      errorMessage = details ? details.message : message;
    } else if (result.error_description || result.message) {
      errorMessage = result.error_description || result.message;
    }

    alert(errorMessage);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
});
