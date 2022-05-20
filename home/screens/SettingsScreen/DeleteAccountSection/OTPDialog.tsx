import { spacing } from '@expo/styleguide-native';
import { useExpoTheme, View, Text } from 'expo-dev-client-components';
import {
  SecondFactorMethod,
  UserSecondFactorDevice,
  useSecondFactorDevicesQuery,
  useSendSmsotpToSecondFactorDeviceMutation,
} from 'graphql/types';
import React, { useEffect, useState } from 'react';
import Dialog from 'react-native-dialog';
import { notEmpty } from 'utils/notEmpty';

import { SMSDevice } from './SMSDevice';

export type PartialUserSecondFactorDevice = Partial<
  Pick<
    UserSecondFactorDevice,
    'id' | 'isPrimary' | 'smsPhoneNumber' | 'method' | 'name' | 'isCertified' | 'createdAt'
  >
>;

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (otp: string) => void;
};

export function OTPDialog(props: Props) {
  const { visible, onCancel, onConfirm } = props;

  const theme = useExpoTheme();
  const [OTP, setOTP] = useState('');

  const { data } = useSecondFactorDevicesQuery();
  const secondFactorDevices = data?.me?.secondFactorDevices.filter(notEmpty);
  const [sendSmsotpToSecondFactorDeviceMutationFunc] = useSendSmsotpToSecondFactorDeviceMutation();

  const [inputError, setInputError] = useState('');
  const primarySMSDevice = secondFactorDevices?.find(
    (secondFactorDevice) =>
      secondFactorDevice.method === SecondFactorMethod.Sms && secondFactorDevice.isPrimary
  );
  const hasAuthenticatorSecondFactorDevice = secondFactorDevices?.some(
    (secondFactorDevice) => secondFactorDevice.method === SecondFactorMethod.Authenticator
  );
  let description;
  const SMSDevices = secondFactorDevices?.filter(
    (secondFactorDevice) => secondFactorDevice.method === SecondFactorMethod.Sms
  );

  if (!description) {
    if (primarySMSDevice) {
      description = `Check your SMS messages for your one-time password. It may take a few moments to arrive. ${
        hasAuthenticatorSecondFactorDevice
          ? 'You may also use a one-time password from your authenticator app.'
          : ''
      }`;
    } else {
      description = 'Open your two-factor authentication app to view your one-time password.';
    }
  }

  useEffect(function didMount() {
    if (primarySMSDevice?.id) {
      sendSMSOTP(primarySMSDevice.id);
    }
  }, []);

  async function sendSMSOTP(deviceId?: string) {
    if (deviceId) {
      await sendSmsotpToSecondFactorDeviceMutationFunc({
        variables: {
          userSecondFactorDeviceId: deviceId,
        },
      });
    }
  }

  async function _onSubmit() {
    if (OTP.trim().length === 0) {
      return setInputError('You must provide a value for the one-time password.');
    }

    onConfirm(OTP);
  }

  return (
    <Dialog.Container visible={visible} onBackdropPress={onCancel}>
      <Dialog.Title>Confirm your one-time password to delete your account</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
      <Dialog.Input
        style={{ fontFamily: 'InterRegular', color: theme.text.default }}
        placeholderTextColor={theme.text.secondary}
        onChangeText={(p) => setOTP(p)}
      />

      {inputError ? (
        <View>
          <Text>{inputError}</Text>
        </View>
      ) : null}
      {SMSDevices && SMSDevices?.length > 0 ? (
        <View style={{ marginBottom: spacing[3] }}>
          <Text type="InterSemiBold">SMS numbers</Text>
          {SMSDevices?.map((device) => (
            <SMSDevice
              key={device.id}
              SMSDevice={device}
              sendSMSOTPAsync={sendSMSOTP}
              sentCode={primarySMSDevice?.id === device.id}
            />
          ))}
        </View>
      ) : null}
      <Text type="InterSemiBold">More two-factor options</Text>
      <Text type="InterRegular">
        Enter a recovery code (from when you set up two-factor authentication) as your one-time
        password.
      </Text>
      <Dialog.Button label="Cancel" onPress={onCancel} />
      <Dialog.Button label="Verify" onPress={_onSubmit} color={theme.text.error} />
    </Dialog.Container>
  );
}
