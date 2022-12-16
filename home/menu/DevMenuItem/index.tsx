import { Row, Spacer, Text } from 'expo-dev-client-components';
import React from 'react';
import { Platform, TouchableOpacity as TouchableOpacityRN } from 'react-native';
import { TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';

type Props = {
  buttonKey: string;
  label: string;
  onPress: (key: string) => any;
  icon?: React.ReactNode;
  isEnabled?: boolean;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableOpacity = Platform.OS === 'android' ? TouchableOpacityGH : TouchableOpacityRN;

export function DevMenuItem({ isEnabled = true, buttonKey, label, onPress, icon }: Props) {
  function _onPress() {
    if (onPress) {
      onPress(buttonKey);
    }
  }

  if (!isEnabled) return null;

  return (
    <TouchableOpacity onPress={_onPress} disabled={!isEnabled}>
      <Row padding="medium" align="center">
        {icon && isEnabled && (
          <>
            {icon}
            <Spacer.Horizontal size="medium" />
          </>
        )}
        <Text type="InterRegular" size="medium" align="center" color="default">
          {label}
        </Text>
      </Row>
    </TouchableOpacity>
  );
}
