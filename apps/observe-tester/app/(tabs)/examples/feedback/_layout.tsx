import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function FeedbackLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Feedback' }} />
      <Stack.Screen name="form" options={{ presentation: 'formSheet', title: 'Feedback' }} />
    </Stack>
  );
}
