import { useApolloClient } from '@apollo/client';
import { InfoIcon } from '@expo/styleguide-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { APIV2Client } from '../../api/APIV2Client';
import { FormStates } from '../../constants/FormStates';
import { Permission, useDeleteAccountPermissionsQuery } from '../../graphql/types';
import { SettingsStackRoutes, HomeStackRoutes } from '../../navigation/Navigation.types';
import { useDispatch } from '../../redux/Hooks';
import SessionActions from '../../redux/SessionActions';
import { useAccountName } from '../../utils/AccountNameContext';
import { notEmpty } from '../../utils/notEmpty';
import { ConfirmationStep } from './ConfirmationStep';
import { OTPStep } from './OTPStep';
import { PasswordStep } from './PasswordStep';
import { handleAccountDeleteAsync, memberHasPermission } from './utils';

export function DeleteAccountScreen({
  route,
}: StackScreenProps<SettingsStackRoutes, 'DeleteAccount'>) {
  const { viewerUsername } = route.params;

  const { data, loading } = useDeleteAccountPermissionsQuery();
  const apolloClient = useApolloClient();
  const navigation = useNavigation<NavigationProp<HomeStackRoutes>>();
  const apiV2Client = new APIV2Client();
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
      } else {
        setFormState(FormStates.LOADING);
        await handleAccountDeleteAsync(apiV2Client, apolloClient, clearSessionSecretData, password);
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
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag">
      <View flex="1" padding="medium">
        <View>
          <View>
            {formError ? (
              <>
                <View bg="error" padding="medium" rounded="medium" border="error">
                  <Text>{formError}</Text>
                </View>
                <Spacer.Vertical size="small" />
              </>
            ) : null}
            {formState === FormStates.LOADING || loading ? (
              <ActivityIndicator color={theme.highlight.accent} />
            ) : null}
            {!canViewConfirmationForm ? (
              <View rounded="medium" bg="secondary" padding="medium" border="default">
                <Row>
                  <InfoIcon color={theme.icon.default} />
                  <Spacer.Horizontal size="small" />
                  <Text type="InterSemiBold">Cannot delete account</Text>
                </Row>
                <Spacer.Vertical size="small" />
                <Text type="InterRegular">
                  Your account is currently the sole owner of these organizations:{' '}
                  <Text type="InterBold">
                    {dependentAccounts.map((account) => account.name).join(', ')}
                  </Text>
                  . You must assign another owner or remove all other members from these
                  organizations before you can delete your account.
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
            <Spacer.Vertical size="small" />
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
