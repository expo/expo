import { useRouter } from 'expo-router';
import { Button, View } from 'react-native';

import { CanGoBackStatus } from '../../components/can-go-back-status';

export default function Modal() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <CanGoBackStatus />
      <Button testID="e2e-go-back" title="Go back" onPress={() => router.back()} />
    </View>
  );
}
