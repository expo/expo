import { InfoIcon } from '@expo/styleguide-native';
import { Button } from 'components/Button';
import {
  Row,
  scale,
  Spacer,
  Text,
  TextInput,
  useExpoTheme,
  View,
} from 'expo-dev-client-components';
import React, { useState } from 'react';
import { Linking } from 'react-native';

const DELETE_ACCOUNT_STRING = 'I understand and I want to delete my account';

type Props = {
  onSubmit: () => void;
};

export function ConfirmationStep({ onSubmit }: Props) {
  const [confirmationMatches, setConfirmationMatches] = useState(false);

  const theme = useExpoTheme();

  function onDeleteConfirmationTextChange(text: string) {
    setConfirmationMatches(text === DELETE_ACCOUNT_STRING);
  }

  return (
    <View bg="default" padding="medium" rounded="medium" border="default">
      <Text type="InterSemiBold" size="medium">
        Confirm deletion
      </Text>
      <Spacer.Vertical size="small" />

      <View rounded="medium" bg="secondary" padding="medium">
        <Row>
          <InfoIcon color={theme.icon.default} />
          <Spacer.Horizontal size="small" />
          <Text type="InterSemiBold">Tip</Text>
        </Row>
        <Spacer.Vertical size="small" />
        <Text type="InterRegular" size="medium">
          Do you want to let someone else inherit your account? You can do so by{' '}
          <Text
            type="InterRegular"
            onPress={() => Linking.openURL('https://expo.dev/settings#convert-account')}
            color="link">
            converting it to an organization
          </Text>
          .
        </Text>
      </View>

      <Spacer.Vertical size="medium" />
      <Text type="InterRegular" size="medium">
        To delete your account, please type:
      </Text>
      <Spacer.Vertical size="small" />
      <View bg="secondary" padding="medium" rounded="medium">
        <Text type="InterRegular">{DELETE_ACCOUNT_STRING}</Text>
      </View>
      <Spacer.Vertical size="small" />
      <TextInput
        rounded="medium"
        style={{
          borderColor: theme.border.default,
          borderWidth: 1,
          padding: scale.medium,
        }}
        placeholderTextColor={theme.text.secondary}
        placeholder={DELETE_ACCOUNT_STRING}
        onChangeText={onDeleteConfirmationTextChange}
      />
      <Spacer.Vertical size="small" />
      <Row justify="end">
        <Button
          label="Delete Account"
          theme="error"
          onPress={onSubmit}
          disabled={!confirmationMatches}
          style={{
            alignSelf: 'flex-start',
          }}
        />
      </Row>
    </View>
  );
}
