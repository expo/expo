import { useTheme } from 'ThemeProvider';
import { Stack } from 'expo-router';
import * as React from 'react';

import { getSearchToolbar, getStackScreenOptions } from '../../../navigation/StackConfig';

export default function ApisLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={getStackScreenOptions(theme)}>
      <Stack.Screen name="index">{getSearchToolbar(theme)}</Stack.Screen>
      <Stack.Screen name="[...id]">{getSearchToolbar(theme)}</Stack.Screen>
    </Stack>
  );
}
