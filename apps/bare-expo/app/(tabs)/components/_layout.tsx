import { useTheme } from 'ThemeProvider';
import { Stack } from 'expo-router';
import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const stackConfig = optionalRequire(() =>
  require('native-component-list/src/navigation/StackConfig')
);

export default function ComponentsLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={stackConfig?.getStackScreenOptions(theme)}>
      <Stack.Screen name="index" options={{ title: 'Components in Expo SDK' }}>
        {stackConfig?.getSearchToolbar(theme)}
      </Stack.Screen>
      <Stack.Screen name="[...id]">{stackConfig?.getSearchToolbar(theme)}</Stack.Screen>
    </Stack>
  );
}
