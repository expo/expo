import { View, ExpoLogoIcon } from 'expo-dev-client-components';
import * as React from 'react';

export function Splash() {
  return (
    <View flex="1" style={{ justifyContent: 'center', alignItems: 'center' }} bg="default">
      <ExpoLogoIcon width={100} height={85} />
    </View>
  );
}
