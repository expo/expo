import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function NestedStackLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Nested stack' }} />
      <Stack.Screen name="network" options={{ title: 'Network' }} />
      <Stack.Screen name="heavy" options={{ title: 'Heavy render' }} />
      <Stack.Screen name="[id]" options={{ title: 'Param' }} />
      <Stack.Screen name="nested" options={{ headerShown: false }} />
    </Stack>
  );
}
