import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Preview' }} />
      <Stack.Screen name="one" options={{ title: 'Title of preview one' }} />
    </Stack>
  );
}
