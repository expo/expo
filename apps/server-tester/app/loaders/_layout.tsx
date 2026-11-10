import { Slot, Stack } from 'expo-router';

// Loader pages replace each other instead of stacking. The loader E2E suites count a loader request
// on every fresh mount, and a stack keeps the previous page mounted when it pops back to it.
export default function LoadersLayout() {
  return (
    <>
      <Stack.Screen options={{ title: 'Loaders' }} />
      <Slot />
    </>
  );
}
