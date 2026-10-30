import { Text, View } from 'react-native';

import { CanGoBackStatus } from '../../../components/can-go-back-status';

export default function First() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">First tab</Text>
      <CanGoBackStatus />
    </View>
  );
}
