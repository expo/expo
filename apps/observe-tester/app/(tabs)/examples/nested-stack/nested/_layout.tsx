import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function NestedNestedLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Nested' }} />
      <Stack.Screen
        name="modal"
        options={{ title: 'Modal', presentation: 'modal' }}
      />
    </Stack>
  );
}
