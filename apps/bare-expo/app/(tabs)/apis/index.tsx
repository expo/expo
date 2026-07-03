import { Stack } from 'expo-router';
import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const ExpoApis = optionalRequire(() =>
  require('native-component-list/src/screens/ExpoApisScreen')
)?.default;
const screenApiItems = optionalRequire(() =>
  require('native-component-list/src/navigation/apiScreens')
)?.screenApiItems;

export default function ApisIndex() {
  if (!ExpoApis) {
    return null;
  }
  return (
    <>
      <Stack.Screen options={{ title: 'APIs in Expo SDK' }} />
      <ExpoApis apis={screenApiItems} />
    </>
  );
}
