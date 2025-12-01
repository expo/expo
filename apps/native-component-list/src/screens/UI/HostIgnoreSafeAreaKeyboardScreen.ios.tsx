import { Host, TextField } from '@expo/ui/swift-ui';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';

function HostIgnoreSafeAreaKeyboardScreen() {
  const bottomOffset = useBottomTabBarHeight();
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
        <Host matchContents ignoreSafeAreaKeyboardInsets style={{ backgroundColor: 'red' }}>
          <TextField placeholder="Enter text" multiline />
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
