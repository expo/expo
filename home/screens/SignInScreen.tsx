import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Analytics from '../api/Analytics';
import ApolloClient from '../api/ApolloClient';
import AuthApi from '../api/AuthApi';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';
import { StyledScrollView as ScrollView } from '../components/Views';
import Colors from '../constants/Colors';
import SessionActions from '../redux/SessionActions';

const DEBUG = false;

type NavigationProps = StackScreenProps<AllStackRoutes, 'SignIn'>;

export default function SignInScreen(props: NavigationProps) {
  const session = useSelector(data => data.session);
  const dispatch = useDispatch();
  return (
    <SignInView
      dispatch={dispatch}
      session={session}
      navigation={props.navigation}
      route={props.route}
    />
  );
}

type Props = NavigationProps & {
  dispatch: (action: any) => void;
  session: { sessionSecret?: string };
};

type State = {
  email: string;
  password: string;
  isLoading: boolean;
};

class SignInView extends React.Component<Props, State> {
  state = DEBUG
    ? {
        email: 'testing@getexponent.com',
        password: 'pass123',
        isLoading: false,
      }
    : {
        email: '',
        password: '',
        isLoading: false,
      };

  _isMounted = false;

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps: Props) {
    const hasNewUserSession = this.props.session.sessionSecret && !prevProps.session.sessionSecret;
    if (hasNewUserSession) {
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedField());
      this.props.navigation.pop();
    }
  }

  render() {
    return (
      <ScrollView
        lightBackgroundColor={Colors.light.greyBackground}
        style={styles.container}
        contentContainerStyle={{ paddingTop: 15 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag">
        <Form>
          <Form.Input
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            textContentType="username"
            keyboardType="email-address"
            label="E-mail or username"
            onChangeText={this._handleChangeEmail}
            onSubmitEditing={this._handleSubmitEmail}
            returnKeyType="next"
            value={this.state.email}
          />
          <Form.Input
            hideBottomBorder
            label="Password"
            textContentType="password"
            ref={view => {
              this._passwordInput = view;
            }}
            onChangeText={this._handleChangePassword}
            onSubmitEditing={this._handleSubmitPassword}
            returnKeyType="done"
            secureTextEntry
            value={this.state.password}
          />
        </Form>
        <PrimaryButton
          isLoading={this.state.isLoading}
          style={{ margin: 20 }}
          onPress={this._handleSubmit}>
          Sign In
        </PrimaryButton>
      </ScrollView>
    );
  }

  _passwordInput: TextInput | null = null;

  _handleSubmitEmail = () => {
    this._passwordInput?.focus();
  };

  _handleSubmitPassword = () => {
    this._handleSubmit();
  };

  _handleChangeEmail = (email: string) => {
    this.setState({ email });
  };

  _handleChangePassword = (password: string) => {
    this.setState({ password });
  };

  _handleSubmit = async () => {
    const { email, password, isLoading } = this.state;

    if (isLoading) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      const result = await AuthApi.signInAsync(email, password);
      if (this._isMounted) {
        const trackingOpts = {
          id: result.id,
          usernameOrEmail: email,
        };
        Analytics.identify(result.id, trackingOpts);
        Analytics.track(Analytics.events.USER_LOGGED_IN, trackingOpts);

        ApolloClient.resetStore();
        this.props.dispatch(SessionActions.setSession({ sessionSecret: result.sessionSecret }));
      }
    } catch (e) {
      this._isMounted && this._handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  };

  _handleError = (error: Error) => {
    const message = error.message || 'Sorry, something went wrong.';
    alert(message);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
