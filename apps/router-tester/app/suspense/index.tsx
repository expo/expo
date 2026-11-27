import { usePathname } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { SuspenseLinks } from '../../components/suspense';

export default function SuspenseIndex() {
  const pathname = usePathname();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 16, gap: 12 }}>
        <Text>Suspense</Text>
        <Text>Current Path: {pathname}</Text>
        <SuspenseLinks />
      </View>
    </ScrollView>
  );
}
