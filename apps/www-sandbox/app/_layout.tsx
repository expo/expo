import { Slot, Stack } from 'expo-router';

export default function Layout() {
  // if (process.env.EXPO_OS === 'web')
  return <Slot />;
  return (
    <Stack>
      <Stack.Screen name="(root)" options={{ title: 'Expo Router' }} />
    </Stack>
  );
}
