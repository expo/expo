import { usePathname } from 'expo-router';
import { useDrawerStatus } from 'expo-router/drawer';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Second() {
  const pathname = usePathname();
  const drawerStatus = useDrawerStatus();

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Second screen</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Text testID="e2e-drawer-status">{drawerStatus}</Text>
    </SafeAreaView>
  );
}
