import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

import { CanGoBackStatus } from '../../../components/can-go-back-status';

export default function Second() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Second tab</Text>
      <CanGoBackStatus />
      <Button testID="e2e-go-back" title="Go back" onPress={() => router.back()} />
    </View>
  );
}
