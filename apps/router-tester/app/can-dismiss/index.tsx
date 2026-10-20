import { Link } from 'expo-router';
import { View } from 'react-native';

import { CanDismissStatus } from '../../components/can-dismiss-status';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <CanDismissStatus screen="Index" />
      <Link testID="e2e-push-details" href="/can-dismiss/details">
        Push details
      </Link>
    </View>
  );
}
