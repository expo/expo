import { View } from 'expo-dev-client-components';
import * as React from 'react';

import { ExpoLogoIcon } from './icons/ExpoLogoIcon';

export function Splash() {
  return (
    <View flex="1" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <ExpoLogoIcon width={100} height={85} />
    </View>
  );
}
