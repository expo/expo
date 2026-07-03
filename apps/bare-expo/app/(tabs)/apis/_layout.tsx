import { useTheme } from 'ThemeProvider';
import { Stack } from 'expo-router';
import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const getStackScreenOptions = optionalRequire(() =>
  require('native-component-list/src/navigation/StackConfig')
)?.getStackScreenOptions;

export default function ApisLayout() {
  const { theme } = useTheme();
  return <Stack screenOptions={getStackScreenOptions?.(theme)} />;
}
