import { Text, View } from 'react-native';

import { Links } from '@/__e2e__/link-preview/components/links';

export default function L1Index() {
  return (
    <View
      style={{
        flex: 1,
        gap: 24,
        backgroundColor: '#C3D350',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: '#000', fontSize: 24 }}>This is L3</Text>
      <Links />
    </View>
  );
}
