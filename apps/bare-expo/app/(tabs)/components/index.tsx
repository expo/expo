import { Stack } from 'expo-router';
import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const ExpoComponents = optionalRequire(() =>
  require('native-component-list/src/screens/ExpoComponentsScreen')
)?.default;
const screenApiItems = optionalRequire(() =>
  require('native-component-list/src/navigation/componentScreens')
)?.screenApiItems;

export default function ComponentsIndex() {
  if (!ExpoComponents) {
    return null;
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Components in Expo SDK' }} />
      <ExpoComponents apis={screenApiItems} />
    </>
  );
}
