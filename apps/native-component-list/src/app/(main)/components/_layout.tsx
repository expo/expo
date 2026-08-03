import { useTheme } from 'ThemeProvider';
import { Stack } from 'expo-router';
import * as React from 'react';

import { getStackScreenOptions } from '../../../navigation/StackConfig';

export default function ComponentsLayout() {
  const { theme } = useTheme();
  return <Stack screenOptions={getStackScreenOptions(theme)} />;
}
