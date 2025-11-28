import { Host, TextField } from '@expo/ui/swift-ui';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HostIgnoreSafeAreaInsetsScreen() {
  const insets = useSafeAreaInsets();
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
        offset={{ closed: -insets.bottom, opened: -8 }}>
        <Host matchContents ignoreSafeAreaInsets style={{ backgroundColor: 'red' }}>
          <TextField placeholder="Enter text" multiline />
        </Host>
      </KeyboardStickyView>
    </View>
  );
}
