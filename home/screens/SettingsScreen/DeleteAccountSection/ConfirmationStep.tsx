import { InfoIcon } from '@expo/styleguide-native';
import { Button } from 'components/Button';
import { FormStates } from 'constants/FormStates';
import {
  Row,
  scale,
  Spacer,
  Text,
  TextInput,
  useExpoTheme,
  View,
} from 'expo-dev-client-components';
import { Permission, DeleteAccountPermissionsQuery } from 'graphql/types';
import React, { useState } from 'react';
import { Linking } from 'react-native';
import { notEmpty } from 'utils/notEmpty';

import { memberHasPermission } from './utils';

const DELETE_ACCOUNT_STRING = 'I understand and I want to delete my account';

type Props = {
  loading: boolean;
  viewerUsername: string;
  accounts: Exclude<DeleteAccountPermissionsQuery['me'], null | undefined>['accounts'];
  onSubmit: () => void;
  formState: FormStates;
};

export function ConfirmationStep({
  accounts,
  loading,
  viewerUsername,
  onSubmit,
  formState,
}: Props) {
  const [confirmationMatches, setConfirmationMatches] = useState(false);

  const theme = useExpoTheme();

  const dependentAccounts = accounts.filter((account) => {
    const members = account?.users ?? [];
    const isViewerOwner = memberHasPermission(account, viewerUsername, Permission.Own);
    const accountOwners = members
      ?.filter(notEmpty)
      ?.filter((member) => member?.permissions?.filter(notEmpty).includes(Permission.Own));

    if (members.length > 1 && isViewerOwner && accountOwners.length === 1) {
      return true;
    }

    return false;
  });

  const canViewConfirmationForm = !loading && dependentAccounts.length === 0;

  function onDeleteConfirmationTextChange(text: string) {
    setConfirmationMatches(text === DELETE_ACCOUNT_STRING);
  }

  return (
    <View bg="default" padding="medium" rounded="medium" border="default">
      <Text type="InterSemiBold" size="medium">
        Confirm deletion
      </Text>
      <Spacer.Vertical size="small" />
      {!loading && dependentAccounts.length > 0 ? (
        <>
          <View rounded="medium" bg="secondary" padding="medium" border="default">
            <Row>
              <InfoIcon color={theme.icon.default} />
              <Spacer.Horizontal size="small" />
              <Text type="InterSemiBold">Cannot delete account</Text>
            </Row>
            <Text type="InterRegular">
              Your account is currently the sole owner of these organizations:{' '}
              <Text type="InterBold">
                {dependentAccounts.map((account) => account.name).join(', ')}
              </Text>
              . You must assign another owner or remove all other members from these organizations
              before you can delete your account.
            </Text>
          </View>
          <Spacer.Vertical size="small" />
        </>
      ) : null}
      {canViewConfirmationForm ? (
        <>
          <View>
            <View rounded="medium" bg="secondary" padding="medium">
              <Row>
                <InfoIcon color={theme.icon.default} />
                <Spacer.Horizontal size="small" />
                <Text type="InterSemiBold">Tip</Text>
              </Row>
              <Spacer.Vertical size="small" />
              <Text type="InterRegular">
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
          </View>
          <Spacer.Vertical size="medium" />
          <Text type="InterRegular">To delete your account, please type:</Text>
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
        </>
      ) : null}
      <Row justify="end">
        <Button
          label="Delete Account"
          theme="error"
          onPress={onSubmit}
          loading={formState === FormStates.LOADING}
          disabled={
            !confirmationMatches || !canViewConfirmationForm || formState !== FormStates.IDLE
          }
          style={{
            alignSelf: 'flex-start',
          }}
        />
      </Row>
    </View>
  );
}
