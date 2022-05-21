import { Button } from 'components/Button';
import {
  useExpoTheme,
  View,
  Text,
  TextInput,
  Row,
  Spacer,
  scale,
} from 'expo-dev-client-components';
import React, { useState } from 'react';

type Props = {
  onCancel: () => void;
  onConfirm: (password: string) => void;
};

export function PasswordStep(props: Props) {
  const { onCancel, onConfirm } = props;

  const [password, setPassword] = useState('');
  const theme = useExpoTheme();

  const [inputError, setInputError] = useState('');

  async function _onSubmit() {
    setInputError('');

    if (password.trim().length === 0) {
      return setInputError('You must provide a password.');
    }

    return onConfirm(password);
  }

  return (
    <View bg="default" padding="medium" rounded="medium" border="default">
      <Text type="InterSemiBold">Confirm password</Text>
      <Spacer.Vertical size="small" />
      <Text type="InterRegular" color="secondary" size="medium">
        To delete your account, you must confirm your current password.
      </Text>
      <Spacer.Vertical size="small" />
      <TextInput
        autoComplete="password"
        secureTextEntry
        placeholder="Enter your password"
        textContentType="password"
        rounded="medium"
        style={{ borderColor: theme.border.default, borderWidth: 1, padding: scale.medium }}
        placeholderTextColor={theme.text.secondary}
        onChangeText={(p) => setPassword(p)}
      />
      <Spacer.Vertical size="small" />

      {inputError ? (
        <>
          <View bg="error" rounded="medium" padding="medium">
            <Text>{inputError}</Text>
          </View>
          <Spacer.Vertical size="small" />
        </>
      ) : null}

      <Row justify="end">
        <Button label="Cancel" onPress={onCancel} theme="secondary" />
        <Spacer.Horizontal size="small" />
        <Button
          label="Confirm"
          onPress={_onSubmit}
          theme="tertiary"
          disabled={password.trim().length === 0}
        />
      </Row>
    </View>
  );
}
