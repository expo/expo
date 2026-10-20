import { View } from 'react-native';

import { CanDismissStatus } from '../../../components/can-dismiss-status';

export default function AnchoredSecond() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <CanDismissStatus screen="Anchored second" />
    </View>
  );
}
