import { Slot, Stack } from 'expo-router';

export default function Layout() {
  return <Slot />;
  return (
    <Stack
      screenOptions={
        {
          // headerShown: false,
        }
      }>
      <Stack.Screen name="(root)" options={{ title: 'Expo Router' }} />
    </Stack>
  );
}
