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
import {
  SecondFactorMethod,
  UserSecondFactorDevice,
  useSecondFactorDevicesQuery,
  useSendSmsotpToSecondFactorDeviceMutation,
} from 'graphql/types';
import React, { Fragment, useEffect, useState } from 'react';
import { notEmpty } from 'utils/notEmpty';

import { SMSDevice } from './SMSDevice';

export type PartialUserSecondFactorDevice = Partial<
  Pick<
    UserSecondFactorDevice,
    'id' | 'isPrimary' | 'smsPhoneNumber' | 'method' | 'name' | 'isCertified' | 'createdAt'
  >
>;

type Props = {
  onCancel: () => void;
  onConfirm: (otp: string) => void;
};

export function OTPStep(props: Props) {
  const { onCancel, onConfirm } = props;

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
    <View bg="default" padding="medium" rounded="medium" border="default">
      <Text type="InterSemiBold">Confirm your one-time password to delete your account</Text>
      <Spacer.Vertical size="small" />
      <Text type="InterRegular" color="secondary">
        {description}
      </Text>
      <Spacer.Vertical size="small" />
      <TextInput
        placeholder="Enter your one-time password"
        autoComplete="sms-otp"
        secureTextEntry
        textContentType="oneTimeCode"
        rounded="medium"
        style={{ borderColor: theme.border.default, borderWidth: 1, padding: scale.medium }}
        placeholderTextColor={theme.text.secondary}
        onChangeText={(p) => setOTP(p)}
      />

      {inputError ? (
        <>
          <Spacer.Vertical size="small" />
          <View bg="error" rounded="medium" padding="medium">
            <Text>{inputError}</Text>
          </View>
        </>
      ) : null}
      <Spacer.Vertical size="medium" />
      {SMSDevices && SMSDevices?.length > 0 ? (
        <View>
          <Text type="InterSemiBold">SMS numbers</Text>
          {SMSDevices?.map((device, i) => (
            <Fragment key={device.id}>
              <SMSDevice
                SMSDevice={device}
                sendSMSOTPAsync={sendSMSOTP}
                sentCode={primarySMSDevice?.id === device.id}
              />
              {i < SMSDevices.length - 1 ? <Spacer.Vertical size="small" /> : null}
            </Fragment>
          ))}
          <Spacer.Vertical size="medium" />
        </View>
      ) : null}
      <Text type="InterSemiBold">More two-factor options</Text>
      <Spacer.Vertical size="small" />
      <Text type="InterRegular">
        Enter a recovery code (from when you set up two-factor authentication) as your one-time
        password.
      </Text>
      <Spacer.Vertical size="medium" />
      <Row justify="end">
        <Button label="Cancel" onPress={onCancel} theme="secondary" />
        <Spacer.Horizontal size="small" />
        <Button
          label="Verify"
          onPress={_onSubmit}
          theme="tertiary"
          disabled={OTP.trim().length === 0}
        />
      </Row>
    </View>
  );
}
