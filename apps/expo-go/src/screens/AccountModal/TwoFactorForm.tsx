import { borderRadius, spacing } from '@expo/styleguide-native';
import { Row, Spacer, Text, View, useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet, TextInput as RNTextInput } from 'react-native';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';

type Props = {
  otp: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onChangeOtp: (value: string) => void;
  onSubmit: () => void;
  onEnterRecoveryCode: () => void;
};

const OTP_LENGTH = 6;

export function TwoFactorForm({
  otp,
  errorMessage,
  isSubmitting,
  onChangeOtp,
  onSubmit,
  onEnterRecoveryCode,
}: Props) {
  const theme = useExpoTheme();
  const inputRef = React.useRef<RNTextInput>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const canSubmit = otp.length === OTP_LENGTH && !isSubmitting;

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChangeOtp(digits);
    if (digits.length === OTP_LENGTH && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <View>
      <Text type="InterRegular" color="secondary" style={{ lineHeight: 22 }}>
        Open your two-factor authentication app to view your one-time password.
      </Text>

      <Spacer.Vertical size="large" />

      <Text type="InterSemiBold" size="medium">
        One-time password
      </Text>
      <Spacer.Vertical size="small" />

      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View>
          <Row align="center" justify="between">
            <DigitGroup otp={otp} startIndex={0} isFocused={isFocused} theme={theme} />
            <Text
              type="InterSemiBold"
              size="large"
              color="secondary"
              style={{ paddingHorizontal: spacing[2] }}>
              -
            </Text>
            <DigitGroup otp={otp} startIndex={3} isFocused={isFocused} theme={theme} />
          </Row>
          <RNTextInput
            ref={inputRef}
            value={otp}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={OTP_LENGTH}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            caretHidden
            style={styles.hiddenInput}
          />
        </View>
      </TouchableWithoutFeedback>

      {errorMessage ? (
        <>
          <Spacer.Vertical size="small" />
          <Text type="InterRegular" color="error" size="small">
            {errorMessage}
          </Text>
        </>
      ) : null}

      <Spacer.Vertical size="large" />

      <TouchableOpacity
        onPress={onSubmit}
        disabled={!canSubmit}
        style={{
          backgroundColor: canSubmit
            ? theme.button.tertiary.background
            : theme.background.secondary,
          borderWidth: canSubmit ? 0 : 1,
          borderColor: theme.border.default,
          padding: spacing[3],
          borderRadius: borderRadius.medium,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          type="InterSemiBold"
          style={{ color: canSubmit ? theme.button.tertiary.foreground : theme.text.secondary }}>
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>

      <Spacer.Vertical size="large" />

      <Text type="InterRegular" color="secondary">
        Lost access to your 2FA device?
      </Text>
      <Spacer.Vertical size="tiny" />
      <TouchableOpacity onPress={onEnterRecoveryCode} hitSlop={8}>
        <Text type="InterSemiBold" style={{ color: theme.link.default }}>
          Enter a recovery code.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function DigitGroup({
  otp,
  startIndex,
  isFocused,
  theme,
}: {
  otp: string;
  startIndex: number;
  isFocused: boolean;
  theme: ReturnType<typeof useExpoTheme>;
}) {
  return (
    <Row align="center" style={{ flex: 1, justifyContent: 'space-between' }}>
      {[0, 1, 2].map((offset) => {
        const index = startIndex + offset;
        const char = otp[index] ?? '';
        const isActive = index === otp.length && isFocused;
        return (
          <View
            key={index}
            style={{
              flex: 1,
              marginHorizontal: 3,
              height: 48,
              backgroundColor: theme.background.secondary,
              borderRadius: borderRadius.medium,
              borderWidth: isActive ? 1.5 : 1,
              borderColor: isActive ? theme.text.default : theme.border.default,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text type="InterSemiBold" size="large" style={{ color: theme.text.default }}>
              {char}
            </Text>
          </View>
        );
      })}
    </Row>
  );
}

const styles = StyleSheet.create({
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});
