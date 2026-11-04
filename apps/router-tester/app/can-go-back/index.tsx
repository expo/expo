import { Link } from 'expo-router';
import { View } from 'react-native';

import { CanGoBackStatus } from '../../components/can-go-back-status';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <CanGoBackStatus />
      <Link testID="e2e-push-details" href="/can-go-back/details">
        Push details
      </Link>
      <Link testID="e2e-push-tabs-second" href="/can-go-back/tabs/second">
        Push tabs (second tab)
      </Link>
      <Link testID="e2e-push-modal" href="/can-go-back/modal">
        Push modal
      </Link>
    </View>
  );
}
