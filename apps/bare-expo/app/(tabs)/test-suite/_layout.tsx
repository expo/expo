import { useTheme } from 'ThemeProvider';
import { Stack } from 'expo-router';
import * as React from 'react';
import { getTestSuiteStackScreenOptions } from 'test-suite/navigationConfig';

export default function TestSuiteLayout() {
  const { theme } = useTheme();
  return <Stack screenOptions={getTestSuiteStackScreenOptions(theme)} />;
}
