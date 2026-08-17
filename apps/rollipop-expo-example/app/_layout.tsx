import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Root layout. The `modal` screen uses a modal presentation so Expo Router's
// modal handling (a separate route rendered above the stack) is exercised.
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="users" />
        <Stack.Screen name="blog/[...slug]" options={{ title: 'Blog' }} />
        <Stack.Screen name="(marketing)/pricing" options={{ title: 'Pricing' }} />
        <Stack.Screen name="(marketing)/terms" options={{ title: 'Terms' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </>
  );
}
