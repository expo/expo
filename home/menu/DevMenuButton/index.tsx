import { Spacer, Text, View } from 'expo-dev-client-components';
import React from 'react';
import { Platform, TouchableOpacity as TouchableOpacityRN } from 'react-native';
import { TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';

type Props = {
  buttonKey: string;
  label: string;
  onPress: (key: string) => any;
  icon?: React.ReactNode;
  isEnabled?: boolean;
  detail?: string;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableOpacity = Platform.OS === 'android' ? TouchableOpacityGH : TouchableOpacityRN;

export function DevMenuButton({ isEnabled = true, buttonKey, label, onPress, icon }: Props) {
  function _onPress() {
    if (onPress) {
      onPress(buttonKey);
    }
  }

  if (!isEnabled) return null;

  return (
    <View flex="1" bg="default" rounded="large">
      <TouchableOpacity onPress={_onPress} disabled={!isEnabled}>
        <View align="centered" padding="medium">
          {icon && isEnabled && (
            <>
              {icon}
              <Spacer.Vertical size="tiny" />
            </>
          )}
          <Text type="InterRegular" size="small" align="center" color="default">
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
