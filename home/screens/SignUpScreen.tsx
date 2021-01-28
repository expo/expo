import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import Analytics from '../api/Analytics';
import AuthApi from '../api/AuthApi';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';
import { StyledScrollView as ScrollView } from '../components/Views';
import Colors from '../constants/Colors';
import { AllStackRoutes } from '../navigation/Navigation.types';
import { useDispatch, useSelector } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';
import { useKeyboardHeight } from '../utils/useKeyboardHeight';

const DEBUG = false;

export default function SignUpScreen(props: StackScreenProps<AllStackRoutes, 'SignUp'>) {
  const session = useSelector(data => data.session);
  const dispatch = useDispatch();
  // TODO(Bacon): This doesn't seem to be required anymore.
  const keyboardHeight = useKeyboardHeight();
  return (
    <SignUpView {...props} keyboardHeight={keyboardHeight} dispatch={dispatch} session={session} />
  );
}

type Props = StackScreenProps<AllStackRoutes, 'SignUp'> & {
  dispatch: (action: any) => void;
  keyboardHeight: number;
  session: { sessionSecret?: string };
};

type InputState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};
type State = InputState & {
  isLoading: boolean;
};

const initialState: State = DEBUG
  ? {
      firstName: 'Brent',
      lastName: 'Vatne',
      username: `brentvatne${Date.now() - 0}`,
      email: `brentvatne+${Date.now() - 0}@gmail.com`,
      password: 'pass123!!!1',
      passwordConfirmation: 'pass123!!!1',
      isLoading: false,
    }
  : {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      isLoading: false,
    };

class SignUpView extends React.Component<Props, State> {
  readonly state: State = initialState;

  private _isMounted?: boolean;

  private lastNameInput?: any;
  private usernameInput?: any;
  private emailInput?: any;
  private passwordInput?: any;
  private passwordConfirmationInput?: any;

  componentDidUpdate(prevProps: Props) {
    if (this.props.session.sessionSecret && !prevProps.session.sessionSecret) {
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
      this.props.navigation.pop();
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
        lightBackgroundColor={Colors.light.greyBackground}
        contentContainerStyle={{ paddingTop: 20 }}
        keyboardShouldPersistTaps="always"
        style={styles.container}>
        <Form>
          <Form.Input
            onChangeText={value => this.updateValue('firstName', value)}
            onSubmitEditing={() => this.handleSubmitEditing('firstName')}
            value={this.state.firstName}
            autoFocus
            autoCorrect={false}
            autoCapitalize="words"
            keyboardType="default"
            textContentType="givenName"
            label="First name"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this.lastNameInput = view;
            }}
            onChangeText={value => this.updateValue('lastName', value)}
            onSubmitEditing={() => this.handleSubmitEditing('lastName')}
            value={this.state.lastName}
            autoCorrect={false}
            autoCapitalize="words"
            keyboardType="default"
            textContentType="familyName"
            label="Last name"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this.usernameInput = view;
            }}
            onChangeText={value => this.updateValue('username', value)}
            onSubmitEditing={() => this.handleSubmitEditing('username')}
            value={this.state.username}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="username"
            keyboardType="default"
            label="Username"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this.emailInput = view;
            }}
            onSubmitEditing={() => this.handleSubmitEditing('email')}
            onChangeText={value => this.updateValue('email', value)}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="emailAddress"
            value={this.state.email}
            keyboardType="email-address"
            label="E-mail address"
            returnKeyType="next"
          />
          <Form.Input
            ref={view => {
              this.passwordInput = view;
            }}
            onSubmitEditing={() => this.handleSubmitEditing('password')}
            onChangeText={value => this.updateValue('password', value)}
            value={this.state.password}
            autoCorrect={false}
            autoCapitalize="none"
            label="Password"
            textContentType="password"
            returnKeyType="next"
            secureTextEntry
          />
          <Form.Input
            ref={view => {
              this.passwordConfirmationInput = view;
            }}
            onSubmitEditing={() => this.handleSubmitEditing('passwordConfirmation')}
            onChangeText={value => this.updateValue('passwordConfirmation', value)}
            value={this.state.passwordConfirmation}
            hideBottomBorder
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="password"
            label="Repeat your password"
            returnKeyType="done"
            secureTextEntry
          />
        </Form>

        <PrimaryButton
          style={{ margin: 20 }}
          onPress={this.handleSubmit}
          isLoading={this.state.isLoading}>
          Sign Up
        </PrimaryButton>

        <View style={{ height: this.props.keyboardHeight }} />
      </ScrollView>
    );
  }

  private handleSubmitEditing = (field: string) => {
    switch (field) {
      case 'firstName':
        this.lastNameInput.focus();
        break;
      case 'lastName':
        this.usernameInput.focus();
        break;
      case 'username':
        this.emailInput.focus();
        break;
      case 'email':
        this.passwordInput.focus();
        break;
      case 'password':
        this.passwordConfirmationInput.focus();
        break;
      case 'passwordConfirmation':
        this.handleSubmit();
        break;
    }
  };

  private updateValue = (key: keyof InputState, value: string) => {
    this.setState({ [key]: value } as InputState);
  };

  private handleSubmit = async () => {
    const { isLoading } = this.state;

    if (isLoading) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      await AuthApi.signUpAsync(this.state);
      Analytics.track(Analytics.events.USER_CREATED_ACCOUNT, { github: false });

      const signInResult = await AuthApi.signInAsync(this.state.email, this.state.password);

      if (this._isMounted) {
        this.props.dispatch(
          SessionActions.setSession({ sessionSecret: signInResult.sessionSecret })
        );
      }
    } catch (e) {
      this._isMounted && this.handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  };

  private handleError = (error: Error) => {
    const errorMessage = error.message || 'Sorry, something went wrong.';
    alert(errorMessage);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
