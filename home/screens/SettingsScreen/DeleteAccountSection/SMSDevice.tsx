import { spacing } from '@expo/styleguide-native';
import { FormStates } from 'constants/FormStates';
import { Button, Row, Spacer, Text } from 'expo-dev-client-components';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { PartialUserSecondFactorDevice } from './OTPDialog';

type Props = {
  SMSDevice: PartialUserSecondFactorDevice;
  sendSMSOTPAsync: (deviceId: string) => Promise<void>;
  sentCode?: boolean;
};

export function SMSDevice(props: Props) {
  const { SMSDevice, sendSMSOTPAsync, sentCode } = props;
  const [buttonState, setButtonState] = useState(FormStates.IDLE);
  const [buttonText, setButtonText] = useState<'Re-send Code' | 'Send Code'>(
    sentCode ? 'Re-send Code' : 'Send Code'
  );

  async function _sendSMSOTPAsync(deviceId: string) {
    try {
      setButtonState(FormStates.LOADING);
      await sendSMSOTPAsync(deviceId);
    } catch (error) {
      console.error(error);
    }

    setButtonState(FormStates.IDLE);
    setButtonText('Re-send Code');
  }

  return (
    <Row align="center">
      <Text type="InterRegular">{SMSDevice.smsPhoneNumber}</Text>
      <Spacer.Horizontal size="small" />
      {buttonState === FormStates.LOADING ? (
        <ActivityIndicator />
      ) : (
        <Button.Container
          style={{ height: spacing[7], padding: `0 ${spacing[4]}px` }}
          bg="ghost"
          border="ghost"
          onPress={() => SMSDevice?.id && _sendSMSOTPAsync(SMSDevice.id)}
          disabled={buttonState !== FormStates.IDLE}>
          <Button.Text color="ghost" size="small">
            {buttonText}
          </Button.Text>
        </Button.Container>
      )}
    </Row>
  );
}
