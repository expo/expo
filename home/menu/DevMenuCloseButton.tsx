import { iconSize, XIcon } from '@expo/styleguide-native';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform, TouchableHighlight as TouchableHighlightRN, View } from 'react-native';
import { TouchableHighlight as TouchableHighlightGH } from 'react-native-gesture-handler';

type Props = {
  onPress: () => void;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableHighlight = Platform.OS === 'android' ? TouchableHighlightGH : TouchableHighlightRN;

const HIT_SLOP = { top: 15, bottom: 15, left: 15, right: 15 };

export function DevMenuCloseButton({ onPress }: Props) {
  const theme = useExpoTheme();

  return (
    <View style={{ position: 'absolute', right: 16, top: 16, zIndex: 3 }}>
      <TouchableHighlight
        onPress={onPress}
        underlayColor={theme.background.default}
        hitSlop={HIT_SLOP}>
        <XIcon size={iconSize.regular} color={theme.icon.default} />
      </TouchableHighlight>
    </View>
  );
}
