import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function DebugLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Debug' }} />
    </Stack>
  );
}
