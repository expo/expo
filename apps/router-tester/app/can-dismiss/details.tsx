import { router } from 'expo-router';
import { Button, View } from 'react-native';

import { CanDismissStatus } from '../../components/can-dismiss-status';

export default function Details() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <CanDismissStatus screen="Details" />
      <Button testID="e2e-dismiss" title="Dismiss" onPress={() => router.dismiss()} />
    </View>
  );
}
