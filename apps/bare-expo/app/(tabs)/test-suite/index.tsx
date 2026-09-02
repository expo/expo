import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { getSelectScreenOptions } from 'test-suite/navigationConfig';
import SelectScreen from 'test-suite/screens/SelectScreen';

export default function Select() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={getSelectScreenOptions()} />
      <SelectScreen
        onRunTests={(tests) => router.push({ pathname: '/test-suite/run', params: { tests } })}
      />
    </>
  );
}
