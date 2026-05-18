import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function ExamplesLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Examples' }} />
      <Stack.Screen name="nested-stack" options={{ headerShown: false }} />
      <Stack.Screen name="preloaded" options={{ headerShown: false }} />
      <Stack.Screen name="modals" options={{ headerShown: false }} />
    </Stack>
  );
}
