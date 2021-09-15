import { connectActionSheet } from '@expo/react-native-action-sheet';
import React from 'react';
import { ActionSheetIOSOptions } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';

export enum UserSecondFactorDeviceMethod {
  AUTHENTICATOR = 'authenticator',
  SMS = 'sms',
}

export type SecondFactorDevice = {
  id: string;
  method: UserSecondFactorDeviceMethod;
  sms_phone_number: string | null;
  is_primary: boolean;
};

type AdditionalTwoFactorOptionsButtonProps = {
  secondFactorDevices: SecondFactorDevice[];
  onSelectSMSSecondFactorDevice: (device: SecondFactorDevice) => void;
  onSelectAuthenticatorOption: () => void;
};

function AdditionalTwoFactorOptionsButton({
  secondFactorDevices,
  onSelectSMSSecondFactorDevice,
  onSelectAuthenticatorOption,
  showActionSheetWithOptions,
}: AdditionalTwoFactorOptionsButtonProps & {
  showActionSheetWithOptions: (
    options: ActionSheetIOSOptions,
    callback: (buttonIndex: number) => void
  ) => void;
}) {
  const handlePress = () => {
    const hasAuthenticatorSecondFactorDevices = secondFactorDevices.some(
      (device) => device.method === UserSecondFactorDeviceMethod.AUTHENTICATOR
    );

    const smsSecondFactorDevices = secondFactorDevices.filter(
      (device) => device.method === UserSecondFactorDeviceMethod.SMS
    );

    const deviceOptions = smsSecondFactorDevices.map((device) => device.sms_phone_number!);
    const options = [
      ...deviceOptions,
      ...(hasAuthenticatorSecondFactorDevices ? ['Authenticator'] : []),
      'Cancel',
    ];
    const cancelButtonIndex = options.lastIndexOf('Cancel');
    showActionSheetWithOptions(
      {
        title: 'Choose a Second-factor Device',
        options,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex < deviceOptions.length) {
          onSelectSMSSecondFactorDevice(smsSecondFactorDevices[buttonIndex]);
        } else if (hasAuthenticatorSecondFactorDevices && buttonIndex === deviceOptions.length) {
          onSelectAuthenticatorOption();
        }
      }
    );
  };

  return (
    <PrimaryButton plain onPress={handlePress}>
      More one-time password options
    </PrimaryButton>
  );
}

export default connectActionSheet<AdditionalTwoFactorOptionsButtonProps>(
  AdditionalTwoFactorOptionsButton
);
