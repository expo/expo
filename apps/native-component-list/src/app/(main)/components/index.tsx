import { Stack } from 'expo-router';
import * as React from 'react';

import { Layout } from '../../../constants';
import { screenApiItems } from '../../../navigation/componentScreens';
import ExpoComponents from '../../../screens/ExpoComponentsScreen';

export default function ComponentsIndex() {
  return (
    <>
      <Stack.Screen
        options={{
          title: Layout.isSmallDevice ? 'Expo SDK Components' : 'Components in Expo SDK',
        }}
      />
      <ExpoComponents apis={screenApiItems} />
    </>
  );
}
