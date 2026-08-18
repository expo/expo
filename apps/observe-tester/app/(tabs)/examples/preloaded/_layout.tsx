import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function PreloadedLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Preloaded' }} />
      <Stack.Screen name="screen-a" options={{ title: 'Screen A' }} />
      <Stack.Screen name="screen-b" options={{ title: 'Screen B' }} />
      <Stack.Screen name="screen-c" options={{ title: 'Screen C' }} />
    </Stack>
  );
}
