import { Host, TextField, useNativeState } from '@expo/ui/swift-ui';
import { View } from 'react-native';
import { KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';

import useOptionalBottomTabBarHeight from '../../utilities/useOptionalBottomTabBarHeight';

function HostIgnoreSafeAreaKeyboardScreen() {
  const bottomOffset = useOptionalBottomTabBarHeight();
  const text = useNativeState('');
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <KeyboardStickyView
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: 'green',
        }}
        offset={{ opened: bottomOffset }}>
        <Host matchContents ignoreSafeArea="keyboard" style={{ backgroundColor: 'red' }}>
          <TextField text={text} placeholder="Enter text" axis="vertical" />
        </Host>
      </KeyboardStickyView>
    </View>
  );
}

export default function HostIgnoreSafeAreaKeyboardScreenWrapper() {
  return (
    <KeyboardProvider>
      <HostIgnoreSafeAreaKeyboardScreen />
    </KeyboardProvider>
  );
}
