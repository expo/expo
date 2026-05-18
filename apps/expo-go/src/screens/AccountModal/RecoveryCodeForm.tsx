import { borderRadius, spacing } from '@expo/styleguide-native';
import { Spacer, Text, View, useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = {
  recoveryCode: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onChangeRecoveryCode: (value: string) => void;
  onSubmit: () => void;
};

export function RecoveryCodeForm({
  recoveryCode,
  errorMessage,
  isSubmitting,
  onChangeRecoveryCode,
  onSubmit,
}: Props) {
  const theme = useExpoTheme();
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const canSubmit = recoveryCode.trim().length > 0 && !isSubmitting;

  return (
    <View>
      <Text type="InterRegular" color="secondary" style={{ lineHeight: 22 }}>
        Enter one of your recovery codes to regain access to your account.
      </Text>

      <Spacer.Vertical size="large" />

      <Text type="InterSemiBold" size="medium">
        Recovery code
      </Text>
      <Spacer.Vertical size="small" />

      <TextInput
        ref={inputRef}
        value={recoveryCode}
        onChangeText={onChangeRecoveryCode}
        autoCapitalize="none"
        autoCorrect={false}
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
          },
        ]}
      />

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
    </View>
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
});
