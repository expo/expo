/* @flow */

import React from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { connect } from 'react-redux';

import SessionActions from '../redux/SessionActions';

import Analytics from '../api/Analytics';
import AuthApi from '../api/AuthApi';
import CloseButton from '../components/CloseButton';
import Colors from '../constants/Colors';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';
import { StyledScrollView as ScrollView } from '../components/Views';

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
        lightBackgroundColor={Colors.light.greyBackground}
        contentContainerStyle={{ paddingTop: 20 }}
        keyboardShouldPersistTaps="always"
        style={styles.container}>
        <Form>
          <Form.Input
            onChangeText={value => this._updateValue('firstName', value)}
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
            onChangeText={value => this._updateValue('lastName', value)}
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
            onChangeText={value => this._updateValue('username', value)}
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
            onChangeText={value => this._updateValue('email', value)}
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
            onChangeText={value => this._updateValue('password', value)}
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
            onChangeText={value => this._updateValue('passwordConfirmation', value)}
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
      await AuthApi.signUpAsync(this.state);
      Analytics.track(Analytics.events.USER_CREATED_ACCOUNT, { github: false });

      let signInResult = await AuthApi.signInAsync(this.state.email, this.state.password);

      if (this._isMounted) {
        this.props.dispatch(
          SessionActions.setSession({ sessionSecret: signInResult.sessionSecret })
        );
      }
    } catch (e) {
      this._isMounted && this._handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  };

  _handleError = (error: Error) => {
    let errorMessage = error.message || 'Sorry, something went wrong.';
    alert(errorMessage);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
