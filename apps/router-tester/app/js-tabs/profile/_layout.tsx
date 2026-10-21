import { Stack } from 'expo-router/js-stack';

import { JSHeaderBackButton, JSHeaderTitle } from '../../../components/demo-screen';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: JSHeaderTitle,
        headerLeft: JSHeaderBackButton,
      }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="details" options={{ title: 'Profile Details' }} />
    </Stack>
  );
}
