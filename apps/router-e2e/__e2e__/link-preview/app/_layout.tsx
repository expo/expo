import { Stack } from 'expo-router';
import { useState } from 'react';

import { TagContext } from '../components/tagContenxt';

const isAllowed = false;

export default function Layout() {
  const v = useState(0);
  return (
    <TagContext value={v}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={isAllowed}>
          <Stack.Screen name="protected" />
        </Stack.Protected>
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
        <Stack.Screen
          name="fullScreenModal"
          options={{ presentation: 'fullScreenModal', headerShown: true }}
        />
      </Stack>
    </TagContext>
  );
}
