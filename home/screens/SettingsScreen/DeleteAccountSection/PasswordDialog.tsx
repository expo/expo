import { useExpoTheme, View, Text } from 'expo-dev-client-components';
import React, { useState } from 'react';
import Dialog from 'react-native-dialog';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void;
};

export function PasswordDialog(props: Props) {
  const { visible, onCancel, onConfirm } = props;

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
    <Dialog.Container visible={visible} onBackdropPress={onCancel}>
      <Dialog.Title>Confirm password</Dialog.Title>
      <Dialog.Description>
        To delete your account, you must confirm your current password.
      </Dialog.Description>
      <Dialog.Input
        style={{ fontFamily: 'Inter-Regular', color: theme.text.default }}
        placeholderTextColor={theme.text.secondary}
        onChangeText={(p) => setPassword(p)}
      />
      {inputError ? (
        <View>
          <Text>{inputError}</Text>
        </View>
      ) : null}
      <Dialog.Button label="Cancel" onPress={onCancel} />
      <Dialog.Button label="Confirm" onPress={_onSubmit} color={theme.text.error} />
    </Dialog.Container>
  );
}
