import { usePathname } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SuspenseLinks } from '../../components/suspense';

export default function SuspenseIndex() {
  const pathname = usePathname();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']} style={{ padding: 16, gap: 12 }}>
        <Text>Suspense</Text>
        <Text>Current Path: {pathname}</Text>
        <SuspenseLinks />
      </SafeAreaView>
    </ScrollView>
  );
}
