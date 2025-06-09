import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack screenOptions={{ headerShown: true, animation: 'slide_from_bottom' }} />;
}
