import { usePathname } from 'expo-router';
import { useDrawerStatus } from 'expo-router/drawer';
import { Text, View } from 'react-native';

export default function Second() {
  const pathname = usePathname();
  const drawerStatus = useDrawerStatus();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Second screen</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Text testID="e2e-drawer-status">{drawerStatus}</Text>
    </View>
  );
}
