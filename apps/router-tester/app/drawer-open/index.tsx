import { useDrawerStatus } from 'expo-router/drawer';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const drawerStatus = useDrawerStatus();

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Open Home screen</Text>
      <Text testID="e2e-drawer-status">{drawerStatus}</Text>
    </SafeAreaView>
  );
}
