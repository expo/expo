import { Stack } from 'expo-router';
import * as React from 'react';

import { screenApiItems } from '../../../navigation/apiScreens';
import ExpoApis from '../../../screens/ExpoApisScreen';

export default function ApisIndex() {
  return (
    <>
      <Stack.Screen options={{ title: 'APIs in Expo SDK' }} />
      <ExpoApis apis={screenApiItems} />
    </>
  );
}
