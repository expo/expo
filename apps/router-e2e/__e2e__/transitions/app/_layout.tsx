import { Stack, useNavigationTransitionPending } from 'expo-router';
import { Text, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

// Playground app for the transitions spike (steps/Step-3.md). Purpose-built to exercise the
// pre-flip (Step 3) and, later, post-flip (Step 5/9) behaviors on a real simulator: navigation to a
// suspending screen, a lazy bundle-split screen, a suspending loader (starvation window, risk 2),
// and native-urgent interleaving (swipe-back, tab press, hardware back) against a pending JS push.

// Global pending indicator drawn in a FullWindowOverlay so it paints ABOVE the native stack — a
// plain sibling View would be covered by the pushed ScreenStack. This validates the documented
// global-pending pattern (Step-9 docs / round-3 FullWindowOverlay finding) on-device: it stays
// visible over a pushed-but-suspended destination for the whole pending window.
function GlobalPendingOverlay() {
  const pending = useNavigationTransitionPending();
  if (!pending) return null;
  return (
    <FullWindowOverlay>
      <View
        testID="global-pending-overlay"
        pointerEvents="none"
        style={{ position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'red' }}>
        <Text testID="global-pending-overlay-text" style={{ color: 'white', padding: 8 }}>
          NAVIGATING…
        </Text>
      </View>
    </FullWindowOverlay>
  );
}

export default function TransitionsLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Transitions' }} />
        <Stack.Screen name="slow" options={{ title: 'Slow (use promise)' }} />
        <Stack.Screen name="lazy" options={{ title: 'Lazy bundle' }} />
        <Stack.Screen name="loader" options={{ title: 'Suspending loader' }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <GlobalPendingOverlay />
    </>
  );
}
