import { Stack } from 'expo-router';

// Playground app for the transitions spike (steps/Step-3.md). Purpose-built to exercise the
// pre-flip (Step 3) and, later, post-flip (Step 5/9) behaviors on a real simulator: navigation to a
// suspending screen, a lazy bundle-split screen, a suspending loader (starvation window, risk 2),
// and native-urgent interleaving (swipe-back, tab press, hardware back) against a pending JS push.
export default function TransitionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Transitions' }} />
      <Stack.Screen name="slow" options={{ title: 'Slow (use promise)' }} />
      <Stack.Screen name="lazy" options={{ title: 'Lazy bundle' }} />
      <Stack.Screen name="loader" options={{ title: 'Suspending loader' }} />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
