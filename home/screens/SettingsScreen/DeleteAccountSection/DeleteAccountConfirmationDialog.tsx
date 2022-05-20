import { useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import Dialog from 'react-native-dialog';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAccountConfirmationDialog(props: Props) {
  const { visible, onCancel, onConfirm } = props;

  const theme = useExpoTheme();

  return (
    <Dialog.Container visible={visible} onBackdropPress={onCancel}>
      <Dialog.Title>Delete account</Dialog.Title>
      <Dialog.Description>
        This will delete your account permanently and there will be no way to recover your account.
        Are you sure?
      </Dialog.Description>
      <Dialog.Button label="Cancel" onPress={onCancel} />
      <Dialog.Button label="Delete" onPress={onConfirm} color={theme.text.error} />
    </Dialog.Container>
  );
}
