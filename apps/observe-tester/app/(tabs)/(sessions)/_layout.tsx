import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function SessionsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="sessions/index" options={{ title: 'Sessions' }} />
      <Stack.Screen name="sessions/[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}
