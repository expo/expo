import { usePathname } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { SuspenseLinks } from '../../components/suspense';

export default function SuspenseIndex() {
  const pathname = usePathname();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      contentInsetAdjustmentBehavior="automatic">
      <Text>Suspense</Text>
      <Text>Current Path: {pathname}</Text>
      <SuspenseLinks />
    </ScrollView>
  );
}
