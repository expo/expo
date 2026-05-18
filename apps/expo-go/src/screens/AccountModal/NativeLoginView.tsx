import { Spacer, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { LoginForm } from './LoginForm';
import { RecoveryCodeForm } from './RecoveryCodeForm';
import { TwoFactorForm } from './TwoFactorForm';
import LoginApi, { isAuthenticationError, isOtpRequired } from '../../api/LoginApi';

type Phase = 'credentials' | 'twoFactor' | 'recoveryCode';

type HeaderConfig = { title?: string; onBack?: () => void } | null;

type Props = {
  onLoginSuccess: (sessionSecret: string) => Promise<void> | void;
  onSSO: () => Promise<void> | void;
  onSignUp: () => Promise<void> | void;
  isWebFlowInFlight: boolean;
  onHeaderOverride: (config: HeaderConfig) => void;
};

export function NativeLoginView({
  onLoginSuccess,
  onSSO,
  onSignUp,
  isWebFlowInFlight,
  onHeaderOverride,
}: Props) {
  const [phase, setPhase] = React.useState<Phase>('credentials');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [recoveryCode, setRecoveryCode] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Keep the password across phase transitions so OTP/recovery submission can re-send it,
  // but clear it from the visible field when leaving credentials (matches LoginViewModel.handleLoginError).
  const savedPasswordRef = React.useRef<string>('');

  const resetToCredentials = React.useCallback(() => {
    setPhase('credentials');
    setOtp('');
    setRecoveryCode('');
    setErrorMessage(null);
    if (savedPasswordRef.current) {
      setPassword(savedPasswordRef.current);
    }
  }, []);

  React.useEffect(() => {
    if (phase === 'credentials') {
      onHeaderOverride(null);
    } else if (phase === 'twoFactor') {
      onHeaderOverride({
        title: 'Two-factor authentication',
        onBack: resetToCredentials,
      });
    } else {
      onHeaderOverride({
        title: 'Recovery code',
        onBack: () => {
          setRecoveryCode('');
          setErrorMessage(null);
          setPhase('twoFactor');
        },
      });
    }
  }, [phase, onHeaderOverride, resetToCredentials]);

  React.useEffect(() => {
    return () => onHeaderOverride(null);
  }, [onHeaderOverride]);

  const submitWithOtp = async (otpValue: string) => {
    if (!otpValue) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const { sessionSecret } = await LoginApi.loginAsync({
        username: username.trim(),
        password: savedPasswordRef.current,
        otp: otpValue.trim(),
      });
      await onLoginSuccess(sessionSecret);
    } catch (e: any) {
      if (isAuthenticationError(e)) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage(e.message ?? 'Something went wrong.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCredentials = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const { sessionSecret } = await LoginApi.loginAsync({
        username: username.trim(),
        password,
      });
      await onLoginSuccess(sessionSecret);
    } catch (e: any) {
      if (isOtpRequired(e)) {
        savedPasswordRef.current = password;
        setPassword('');
        setPhase('twoFactor');
      } else if (isAuthenticationError(e)) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage(e.message ?? 'Something went wrong.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled">
      <Spacer.Vertical size="medium" />
      <View>
        {phase === 'credentials' ? (
          <LoginForm
            username={username}
            password={password}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            isWebFlowInFlight={isWebFlowInFlight}
            onChangeUsername={setUsername}
            onChangePassword={setPassword}
            onSubmit={onSubmitCredentials}
            onSSO={onSSO}
            onSignUp={onSignUp}
          />
        ) : phase === 'twoFactor' ? (
          <TwoFactorForm
            otp={otp}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            onChangeOtp={setOtp}
            onSubmit={() => submitWithOtp(otp)}
            onEnterRecoveryCode={() => {
              setRecoveryCode('');
              setErrorMessage(null);
              setPhase('recoveryCode');
            }}
          />
        ) : (
          <RecoveryCodeForm
            recoveryCode={recoveryCode}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            onChangeRecoveryCode={setRecoveryCode}
            onSubmit={() => submitWithOtp(recoveryCode)}
          />
        )}
      </View>
    </ScrollView>
  );
}
