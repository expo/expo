import { Link, Stack } from 'expo-router';
import { PlatformColor, View } from 'react-native';

export default function Settings() {
  return (
    <View style={{ flex: 1, padding: 20, gap: 8 }}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Link
        testID="split-view-navigation-device"
        href="/split-view-navigation/settings/123"
        push
        style={{ fontSize: 17, color: PlatformColor('link') }}>
        Device 123
      </Link>
      <Link
        href="/split-view-navigation/settings/modal"
        style={{ fontSize: 17, color: PlatformColor('link') }}>
        Open modal
      </Link>
    </View>
  );
}
