import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import Analytics from '../api/Analytics';
import ApiV2Error from '../api/ApiV2Error';
import ApolloClient from '../api/ApolloClient';
import AuthApi from '../api/AuthApi';
import AdditionalTwoFactorOptionsButton, {
  SecondFactorDevice,
} from '../components/AdditionalTwoFactorOptionsButton';
import Form from '../components/Form';
import PrimaryButton from '../components/PrimaryButton';
import { StyledScrollView as ScrollView } from '../components/Views';
import Colors from '../constants/Colors';
import { useDispatch, useSelector } from '../redux/Hooks';
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
  otp: string | undefined;
  isOTPFieldVisible: boolean;
  secondFactorDevices: SecondFactorDevice[];
  isLoading: boolean;
};

class SignInView extends React.Component<Props, State> {
  state = DEBUG
    ? {
        email: 'testing@getexponent.com',
        password: 'pass123',
        otp: undefined,
        isOTPFieldVisible: false,
        secondFactorDevices: [],
        isLoading: false,
      }
    : {
        email: '',
        password: '',
        otp: undefined,
        isOTPFieldVisible: false,
        secondFactorDevices: [],
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
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
      this.props.navigation.pop();
    }
  }

  render() {
    const otpField = this.state.isOTPFieldVisible ? (
      <Form.Input
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="oneTimeCode"
        ref={view => {
          this._otpInput = view as TextInput;
        }}
        keyboardType="default"
        label="One-time Password"
        onChangeText={this._handleChangeOTP}
        onSubmitEditing={this._handleSubmitOTP}
        returnKeyType="done"
        value={this.state.otp}
      />
    ) : null;

    const moreOTPOptionsButtom = this.state.isOTPFieldVisible ? (
      <AdditionalTwoFactorOptionsButton
        secondFactorDevices={this.state.secondFactorDevices}
        onSelectSMSSecondFactorDevice={this._handleSelectSMSSecondFactorDevice}
        onSelectAuthenticatorOption={this._handleSelectAuthenticatorOption}
      />
    ) : null;

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
            hideBottomBorder={!this.state.isOTPFieldVisible}
            label="Password"
            textContentType="password"
            ref={view => {
              this._passwordInput = view as TextInput;
            }}
            onChangeText={this._handleChangePassword}
            onSubmitEditing={this._handleSubmitPassword}
            returnKeyType={this.state.isOTPFieldVisible ? 'next' : 'done'}
            secureTextEntry
            value={this.state.password}
          />
          {otpField}
        </Form>
        <PrimaryButton
          isLoading={this.state.isLoading}
          style={{ margin: 20 }}
          onPress={this._handleSubmit}>
          Sign In
        </PrimaryButton>
        {moreOTPOptionsButtom}
      </ScrollView>
    );
  }

  _passwordInput: TextInput | null = null;
  _otpInput: TextInput | null = null;

  _handleSubmitEmail = () => {
    this._passwordInput?.focus();
  };

  _handleSubmitPassword = () => {
    this._handleSubmit();
  };

  _handleSubmitOTP = () => {
    this._handleSubmit();
  };

  _handleChangeEmail = (email: string) => {
    this.setState({ email });
  };

  _handleChangePassword = (password: string) => {
    this.setState({ password });
  };

  _handleChangeOTP = (otp: string) => {
    this.setState({ otp });
  };

  _handleSelectSMSSecondFactorDevice = async (device: SecondFactorDevice) => {
    this.setState({ isLoading: true, otp: undefined });

    try {
      await AuthApi.sendSMSOTPAsync(this.state.email, this.state.password, device.id);
    } catch (e) {
      this._isMounted && this._handleError(e);
    } finally {
      this._isMounted && this.setState({ isLoading: false });
    }
  };

  _handleSelectAuthenticatorOption = () => {
    this.setState({ otp: '' });
    this._otpInput?.focus();
  };

  _handleSubmit = async () => {
    const { email, password, otp, isLoading } = this.state;

    if (isLoading) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      const result = await AuthApi.signInAsync(email, password, otp);
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
    if (error instanceof ApiV2Error && error.code === 'ONE_TIME_PASSWORD_REQUIRED') {
      const metadata: {
        secondFactorDevices: SecondFactorDevice[];
        smsAutomaticallySent: boolean;
      } = error.metadata as any;
      this.setState({ isOTPFieldVisible: true, secondFactorDevices: metadata.secondFactorDevices });
      this._otpInput?.focus();
      return;
    }

    const message = error.message || 'Sorry, something went wrong.';
    alert(message);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
