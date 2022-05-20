import { ApolloClient, useApolloClient } from '@apollo/client';
import { borderRadius, InfoIcon, TrashIcon } from '@expo/styleguide-native';
import Analytics from 'api/Analytics';
import ApiV2HttpClient from 'api/ApiV2HttpClient';
import { SectionHeader } from 'components/SectionHeader';
import { FormStates } from 'constants/FormStates';
import { Row, Spacer, Text, TextInput, useExpoTheme, View } from 'expo-dev-client-components';
import {
  useDeleteAccountPermissionsQuery,
  UserPermissionDataFragment,
  Permission,
} from 'graphql/types';
import React, { useState } from 'react';
import { ActivityIndicator, Linking } from 'react-native';
import Dialog from 'react-native-dialog';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useDispatch } from 'redux/Hooks';
import SessionActions from 'redux/SessionActions';
import { useAccountName } from 'utils/AccountNameContext';
import { notEmpty } from 'utils/notEmpty';

import { DeleteAccountConfirmationDialog } from './DeleteAccountConfirmationDialog';
import { OTPDialog } from './OTPDialog';
import { PasswordDialog } from './PasswordDialog';

const DELETE_ACCOUNT_STRING = 'I understand and I want to delete my account';

const handleAccountDeleteAsync = async (
  apiV2Client: ApiV2HttpClient,
  client: ApolloClient<any>,
  clearSessionSecretData: () => void,
  password: string,
  otp?: string
) => {
  await apiV2Client.postAsync('auth/delete-user', {
    notify: true,
    otp,
    password,
  });

  if (client) {
    client.clearStore();
  }
  clearSessionSecretData();
};

type AccountRequiredShape = {
  owner?: { username: string } | null;
  users: {
    user?: { username: string } | null;
    permissions: UserPermissionDataFragment['permissions'];
  }[];
};

export function memberHasPermission(
  account: AccountRequiredShape,
  username: string,
  permission: Permission
) {
  return Boolean(
    account.users?.find(
      (member) => member?.user?.username === username && member?.permissions?.includes(permission)
    )
  );
}

type Props = {
  viewerUsername: string;
};

export function DeleteAccount(props: Props) {
  const { viewerUsername } = props;
  const { data, loading } = useDeleteAccountPermissionsQuery();
  const apolloClient = useApolloClient();
  const apiV2Client = new ApiV2HttpClient();
  const [formState, setFormState] = useState(FormStates.IDLE);
  const [inputError, setInputError] = useState('');
  const [formError, setFormError] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [confirmationMatches, setConfirmationMatches] = useState(false);
  const secondFactorDevices = data?.me?.secondFactorDevices.filter(notEmpty);
  const hasSecondFactorDevices = secondFactorDevices && secondFactorDevices.length > 0;
  const [confirmationDialogConfig, setConfirmationDialogConfig] = useState({
    visible: false,
    onCancel: () => {},
    onConfirm: () => {},
  });
  const [passwordDialogConfig, setPasswordDialogConfig] = useState({
    visible: false,
    onCancel: () => {},
    onConfirm: (_password: string) => {},
  });
  const [OTPDialogConfig, setOTPDialogConfig] = useState({
    visible: false,
    onCancel: () => {},
    onConfirm: (_otp: string) => {},
  });
  const theme = useExpoTheme();

  const { setAccountName } = useAccountName();
  const dispatch = useDispatch();

  function confirmAsync() {
    return new Promise<boolean>(function (resolve) {
      setDialogVisible(true);
      setConfirmationDialogConfig({
        visible: true,
        onCancel: () => {
          setConfirmationDialogConfig({
            visible: false,
            onCancel: () => {},
            onConfirm: () => {},
          });
          setDialogVisible(false);
          resolve(false);
        },
        onConfirm: () => {
          setConfirmationDialogConfig({
            visible: false,
            onCancel: () => {},
            onConfirm: () => {},
          });
          setDialogVisible(false);
          resolve(true);
        },
      });
    });
  }

  function confirmPasswordAsync() {
    return new Promise<string>(function (resolve) {
      setDialogVisible(true);
      setPasswordDialogConfig({
        visible: true,
        onCancel: () => {
          setPasswordDialogConfig({
            visible: false,
            onCancel: () => {},
            onConfirm: () => {},
          });
          setDialogVisible(false);
          resolve('');
        },
        onConfirm: (password: string) => {
          setPasswordDialogConfig({
            visible: false,
            onCancel: () => {},
            onConfirm: () => {},
          });
          setDialogVisible(false);
          resolve(password);
        },
      });
    });
  }

  function confirmOTPAsync() {
    return new Promise<string>(function (resolve) {
      setOTPDialogConfig({
        visible: true,
        onCancel: () => {
          setOTPDialogConfig({
            visible: false,
            onCancel: () => {},
            onConfirm: () => {},
          });
          resolve('');
        },
        onConfirm: (OTP: string) => {
          setOTPDialogConfig({
            visible: false,
            onCancel: () => {},
            onConfirm: () => {},
          });
          resolve(OTP);
        },
      });
    });
  }

  function clearSessionSecretData() {
    setAccountName(undefined);
    dispatch(SessionActions.signOut());
  }

  function onDeleteConfirmationTextChange(text: string) {
    setConfirmationMatches(text === DELETE_ACCOUNT_STRING);
  }

  async function _onSubmit() {
    setInputError('');
    setFormError('');

    const confirmation = await confirmAsync();

    if (!confirmation) return;

    console.log({ confirmation });

    const password = await confirmPasswordAsync();

    console.log({ password });

    if (!password) return;

    if (hasSecondFactorDevices) {
      const otp = await confirmOTPAsync();

      if (!otp) return;

      setFormState(FormStates.LOADING);
      await handleAccountDeleteAsync(
        apiV2Client,
        apolloClient,
        clearSessionSecretData,
        password,
        otp
      );
      setFormState(FormStates.SUCCESS);
      Analytics.track(Analytics.events.USER_DELETED_ACCOUNT);
      window.location.href = '/';
    } else {
      try {
        setFormState(FormStates.LOADING);
        await handleAccountDeleteAsync(apiV2Client, apolloClient, clearSessionSecretData, password);
        setFormState(FormStates.SUCCESS);
        Analytics.track(Analytics.events.USER_DELETED_ACCOUNT);
        window.location.href = '/';
      } catch (error) {
        const errorMessage = (error as Error).message;

        setFormError(
          (errorMessage ?? 'Something went wrong and we could not delete your account.') +
            `${
              errorMessage?.trim()?.endsWith('.') ? '' : '.'
            } If you need help, please go to expo.dev/contact for assistance.`
        );
        setFormState(FormStates.IDLE);
      }
    }
  }

  const accounts = data?.me?.accounts ?? [];
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

  return (
    <View>
      <SectionHeader header="Delete Account" style={{ paddingTop: 0 }} />
      <View>
        <Row align="center">
          <TrashIcon color={theme.icon.default} />
          <Text type="InterSemiBold">Delete your account</Text>
        </Row>
        <Text type="InterRegular" color="secondary">
          This action is irreversible. It will delete your personal account, projects, and activity.
        </Text>
        {loading && <ActivityIndicator color={theme.highlight.accent} />}
        {!loading && dependentAccounts.length > 0 ? (
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
        ) : null}
        {canViewConfirmationForm ? (
          <>
            <View>
              <View rounded="medium" bg="secondary" padding="medium" border="default">
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
            <View>
              <Text type="InterRegular">To delete your account, please type:</Text>
            </View>
            <View bg="secondary" padding="medium" rounded="medium">
              <Text type="InterRegular">{DELETE_ACCOUNT_STRING}</Text>
            </View>
            <View bg="default" padding="medium" rounded="medium" border="default">
              <TextInput
                placeholder={DELETE_ACCOUNT_STRING}
                onChangeText={onDeleteConfirmationTextChange}
              />
              {inputError ? (
                <View bg="error" rounded="medium">
                  <Text>{inputError}</Text>
                </View>
              ) : null}
            </View>
            {formError ? (
              <View bg="error" rounded="medium">
                <Text>{formError}</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: theme.background.error,
          borderRadius: borderRadius.medium,
          paddingVertical: 8,
          borderColor: theme.border.error,
          borderWidth: 1,
          paddingHorizontal: 16,
          alignSelf: 'flex-start',
        }}
        disabled={!confirmationMatches || !canViewConfirmationForm || formState !== FormStates.IDLE}
        onPress={_onSubmit}>
        <Text type="InterSemiBold" style={{ color: theme.text.error }}>
          Delete Account
        </Text>
      </TouchableOpacity>
      <DeleteAccountConfirmationDialog {...confirmationDialogConfig} />
      <PasswordDialog {...passwordDialogConfig} />
      <OTPDialog {...OTPDialogConfig} />
    </View>
  );
}
