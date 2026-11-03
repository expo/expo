import { Link, Stack } from 'expo-router';
import { PlatformColor, ScrollView } from 'react-native';

const linkStyle = { fontSize: 17, color: PlatformColor('link') };

export default function Settings() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 8 }}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Link
        testID="split-view-navigation-device"
        href="/split-view-navigation/settings/123"
        push
        style={linkStyle}>
        Device 123
      </Link>
      <Link href="/split-view-navigation/settings/one" push style={linkStyle}>
        One
      </Link>
      <Link href="/split-view-navigation/settings/two" push style={linkStyle}>
        Two
      </Link>
      <Link href="/split-view-navigation/settings/three" push style={linkStyle}>
        Three (nested Stack)
      </Link>
      <Link href="/split-view-navigation/settings/modal" style={linkStyle}>
        Open modal
      </Link>
    </ScrollView>
  );
}
