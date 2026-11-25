import { Slot, Stack } from 'expo-router';

// The HMR E2E tests edit the routes in this directory while other test files run.
// Do not assert on these routes in a different test file.
export default function HmrLayout() {
  return (
    <>
      <Stack.Screen options={{ title: 'HMR' }} />
      <Slot />
    </>
  );
}
