import { Text, View } from 'react-native';

import { Links } from '@/__e2e__/link-preview/components/links';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        gap: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: '#000', fontSize: 24 }}>This is Nested Index</Text>
      <Links />
    </View>
  );
}
