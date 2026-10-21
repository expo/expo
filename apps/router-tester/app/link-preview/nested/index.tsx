import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Links } from '@/components/link-preview/links';

export default function Index() {
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flex: 1,
        gap: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: '#000', fontSize: 24 }}>This is Nested Index</Text>
      <Links />
    </SafeAreaView>
  );
}
