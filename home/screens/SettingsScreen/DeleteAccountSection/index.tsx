import { useApolloClient } from '@apollo/client';
import { InfoIcon, TrashIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import Analytics from 'api/Analytics';
import ApiV2HttpClient from 'api/ApiV2HttpClient';
import { SectionHeader } from 'components/SectionHeader';
import { FormStates } from 'constants/FormStates';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import { Permission, useDeleteAccountPermissionsQuery } from 'graphql/types';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useDispatch } from 'redux/Hooks';
import SessionActions from 'redux/SessionActions';
import { useAccountName } from 'utils/AccountNameContext';
import { notEmpty } from 'utils/notEmpty';

import { ConfirmationStep } from './ConfirmationStep';
import { OTPStep } from './OTPStep';
import { PasswordStep } from './PasswordStep';
import { handleAccountDeleteAsync, memberHasPermission } from './utils';

type Props = {
  viewerUsername: string;
};

export function DeleteAccountSection(props: Props) {
  const { viewerUsername } = props;
  const { data, loading } = useDeleteAccountPermissionsQuery();
  const apolloClient = useApolloClient();
  const navigation = useNavigation();
  const apiV2Client = new ApiV2HttpClient();
  const [formState, setFormState] = useState(FormStates.IDLE);
  const [formError, setFormError] = useState('');
  const secondFactorDevices = data?.me?.secondFactorDevices.filter(notEmpty);
  const hasSecondFactorDevices = secondFactorDevices && secondFactorDevices.length > 0;
  const [visibleStep, setVisibleStep] = useState<'confirm' | 'password' | 'otp'>('confirm');
  const [passwordDialogConfig, setPasswordDialogConfig] = useState({
    onCancel: () => {},
    onConfirm: (_password: string) => {},
  });
  const [OTPDialogConfig, setOTPDialogConfig] = useState({
    onCancel: () => {},
    onConfirm: (_otp: string) => {},
  });
  const theme = useExpoTheme();

  const { setAccountName } = useAccountName();
  const dispatch = useDispatch();

  function confirmPasswordAsync() {
    return new Promise<string>(function (resolve) {
      setVisibleStep('password');
      setPasswordDialogConfig({
        onCancel: () => {
          setVisibleStep('confirm');
          resolve('');
        },
        onConfirm: (password: string) => {
          setVisibleStep('confirm');
          resolve(password);
        },
      });
    });
  }

  function confirmOTPAsync() {
    return new Promise<string>(function (resolve) {
      setVisibleStep('otp');
      setOTPDialogConfig({
        onCancel: () => {
          setVisibleStep('confirm');
          resolve('');
        },
        onConfirm: (OTP: string) => {
          setVisibleStep('confirm');
          resolve(OTP);
        },
      });
    });
  }

  function clearSessionSecretData() {
    setAccountName(undefined);
    dispatch(SessionActions.signOut());
    navigation.navigate('Home');
  }

  async function _onSubmit() {
    setFormError('');

    const password = await confirmPasswordAsync();

    if (!password) return;

    try {
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
        Analytics.track(Analytics.events.USER_DELETED_ACCOUNT);
      } else {
        setFormState(FormStates.LOADING);
        await handleAccountDeleteAsync(apiV2Client, apolloClient, clearSessionSecretData, password);
        Analytics.track(Analytics.events.USER_DELETED_ACCOUNT);
      }
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
      <SectionHeader header="Delete Account" />
      <View>
        <View bg="default" padding="medium" rounded="large" border="default">
          <Row align="center">
            <TrashIcon color={theme.icon.default} />
            <Spacer.Horizontal size="small" />
            <Text type="InterSemiBold" size="large">
              Delete your account
            </Text>
          </Row>
          <Spacer.Vertical size="small" />
          <Text type="InterRegular" color="secondary">
            This action is irreversible. It will delete your personal account, projects, and
            activity.
          </Text>
          <Spacer.Vertical size="small" />
          {formError ? (
            <>
              <View bg="error" padding="medium" rounded="medium">
                <Text>{formError}</Text>
              </View>
              <Spacer.Vertical size="small" />
            </>
          ) : null}
          {formState === FormStates.LOADING || loading ? (
            <ActivityIndicator color={theme.highlight.accent} />
          ) : null}
          {!canViewConfirmationForm ? (
            <View rounded="medium" bg="secondary" padding="medium">
              <Row>
                <InfoIcon color={theme.icon.default} />
                <Spacer.Horizontal size="small" />
                <Text type="InterSemiBold">Cannot delete account</Text>
              </Row>
              <Spacer.Vertical size="small" />
              <Text type="InterRegular" size="medium">
                Your account is currently the sole owner of these organizations:{' '}
                <Text type="InterBold">
                  {dependentAccounts.map((account) => account.name).join(', ')}
                </Text>
                . You must assign another owner or remove all other members from these organizations
                before you can delete your account.
              </Text>
            </View>
          ) : null}
          {!(formState === FormStates.LOADING) &&
          canViewConfirmationForm &&
          visibleStep === 'confirm' ? (
            <ConfirmationStep onSubmit={_onSubmit} />
          ) : null}
          {visibleStep === 'password' ? <PasswordStep {...passwordDialogConfig} /> : null}
          {visibleStep === 'otp' ? <OTPStep {...OTPDialogConfig} /> : null}
        </View>
      </View>
    </View>
  );
}
