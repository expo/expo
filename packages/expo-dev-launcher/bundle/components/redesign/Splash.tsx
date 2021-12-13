import { View, ExpoLogoIcon } from 'expo-dev-client-components';
import * as React from 'react';

const iconWidth = 85;

export function Splash() {
  return (
    <View flex="1" style={{ justifyContent: 'center', alignItems: 'center' }} bg="default">
      <ExpoLogoIcon style={{ width: iconWidth, resizeMode: 'contain' }} resizeMode="contain" />
    </View>
  );
}
