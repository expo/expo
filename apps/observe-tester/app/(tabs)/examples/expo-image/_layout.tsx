import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function ExpoImageLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Expo Image' }} />
      <Stack.Screen name="correct" options={{ title: 'Correctly sized' }} />
      <Stack.Screen name="too-big" options={{ title: 'Too big' }} />
      <Stack.Screen name="correct-image" options={{ title: 'Correct (<Image>)' }} />
      <Stack.Screen name="too-big-image" options={{ title: 'Too big (<Image>)' }} />
      <Stack.Screen name="too-big-phone" options={{ title: 'Too big on phone' }} />
    </Stack>
  );
}
