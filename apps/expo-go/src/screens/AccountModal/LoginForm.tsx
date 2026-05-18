import { borderRadius, iconSize, spacing } from '@expo/styleguide-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Row, Spacer, Text, View, useExpoTheme } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Linking, StyleSheet, TextInput } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import Config from '../../api/Config';

type Props = {
  username: string;
  password: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  isWebFlowInFlight: boolean;
  onChangeUsername: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onSSO: () => void;
  onSignUp: () => void;
};

export function LoginForm({
  username,
  password,
  errorMessage,
  isSubmitting,
  isWebFlowInFlight,
  onChangeUsername,
  onChangePassword,
  onSubmit,
  onSSO,
  onSignUp,
}: Props) {
  const theme = useExpoTheme();
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const passwordRef = React.useRef<TextInput>(null);

  const canSubmit = username.trim().length > 0 && password.trim().length > 0 && !isSubmitting;

  const onForgotPasswordPress = () => {
    Linking.openURL(`${Config.website.origin}/reset-password`).catch(() => {
      WebBrowser.openBrowserAsync(`${Config.website.origin}/reset-password`).catch(() => {});
    });
  };

  return (
    <View>
      <Text type="InterSemiBold" size="medium">
        Email or username
      </Text>
      <Spacer.Vertical size="tiny" />
      <TextInput
        value={username}
        onChangeText={onChangeUsername}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        autoComplete="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        style={[
          styles.field,
          {
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.default,
            color: theme.text.default,
          },
        ]}
      />

      <Spacer.Vertical size="medium" />

      <Row align="center" justify="between">
        <Text type="InterSemiBold" size="medium">
          Password
        </Text>
        <TouchableOpacity onPress={onForgotPasswordPress} hitSlop={8}>
          <Text type="InterSemiBold" size="small" style={{ color: theme.link.default }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </Row>
      <Spacer.Vertical size="tiny" />
      <View style={{ position: 'relative' }}>
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={onChangePassword}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="password"
          returnKeyType="go"
          onSubmitEditing={() => {
            if (canSubmit) onSubmit();
          }}
          style={[
            styles.field,
            {
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.default,
              color: theme.text.default,
              paddingRight: 44,
            },
          ]}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible((v) => !v)}
          hitSlop={8}
          style={styles.eyeButton}>
          <Ionicons
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={iconSize.regular}
            color={theme.icon.default}
          />
        </TouchableOpacity>
      </View>

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
          style={{
            color: canSubmit ? theme.button.tertiary.foreground : theme.text.secondary,
          }}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Text>
      </TouchableOpacity>

      <Spacer.Vertical size="large" />

      <Row align="center">
        <View
          flex="1"
          style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border.default }}
        />
        <Text type="InterRegular" color="secondary" style={{ paddingHorizontal: spacing[3] }}>
          or
        </Text>
        <View
          flex="1"
          style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border.default }}
        />
      </Row>

      <Spacer.Vertical size="large" />

      <SecondaryButton label="Continue with SSO" onPress={onSSO} disabled={isWebFlowInFlight} />
      <Spacer.Vertical size="small" />
      <SecondaryButton
        label="New to Expo? Sign up"
        onPress={onSignUp}
        disabled={isWebFlowInFlight}
      />
    </View>
  );
}

function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useExpoTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: theme.background.secondary,
        borderWidth: 1,
        borderColor: theme.border.default,
        padding: spacing[3],
        borderRadius: borderRadius.medium,
        opacity: disabled ? 0.6 : 1,
      }}>
      <Row align="center" justify="between">
        <Text type="InterSemiBold" style={{ color: theme.text.default }}>
          {label}
        </Text>
        <Ionicons name="arrow-forward" size={iconSize.regular} color={theme.icon.default} />
      </Row>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
