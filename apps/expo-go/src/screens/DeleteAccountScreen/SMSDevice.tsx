import { Row, Spacer, Text } from 'expo-dev-client-components';
import React, { useState } from 'react';

import { PartialUserSecondFactorDevice } from './OTPStep';
import { Button } from '../../components/Button';
import { FormStates } from '../../constants/FormStates';

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
      alert(error);
    }

    setButtonState(FormStates.IDLE);
    setButtonText('Re-send Code');
  }

  return (
    <Row align="center" style={{ minHeight: 48 }}>
      <Text type="InterRegular">{SMSDevice.smsPhoneNumber}</Text>
      <Spacer.Horizontal size="small" />
      <Button
        theme="ghost"
        label={buttonText}
        onPress={() => SMSDevice?.id && _sendSMSOTPAsync(SMSDevice.id)}
        disabled={buttonState !== FormStates.IDLE}
        loading={buttonState === FormStates.LOADING}
      />
    </Row>
  );
}
