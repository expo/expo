import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ presentation: 'formSheet' }}
        unstable_requiredScreensBelow={['a']}
      />
      <Stack.Screen
        name="a"
        options={{ presentation: 'formSheet' }}
        unstable_requiredScreensBelow={['d', 'b']}
      />
      <Stack.Screen name="b" />
      <Stack.Screen name="c" />
      <Stack.Screen name="d" />
    </Stack>
  );
}
