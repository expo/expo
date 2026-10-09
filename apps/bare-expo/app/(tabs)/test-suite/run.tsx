import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import TestScreen from 'test-suite/screens/TestScreen';

export default function Run() {
  const { tests } = useLocalSearchParams<{ tests?: string | string[] }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Test Runner' }} />
      <TestScreen route={{ params: { tests: Array.isArray(tests) ? tests.join(',') : tests } }} />
    </>
  );
}
