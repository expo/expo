import { Link, router } from 'expo-router';
import { useTransition } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

import { resolveDelay } from '../components/delay';

// The router-owned pending hooks (useNavigationTransitionPending / useLinkStatus) don't exist until
// Step 8, so this app uses a caller-side `useTransition` as the stand-in probe: it characterizes
// whether wrapping `router.push` in the caller's own transition tracks `isPending` (spike item d),
// and — pre-flip — whether the bare push already behaves as a transition (it doesn't yet).
export default function Index() {
  const [isPending, startTransition] = useTransition();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text testID="index-title" style={{ fontSize: 18, fontWeight: '600' }}>
        Transitions playground
      </Text>
      <Text testID="pending-readout">pending: {String(isPending)}</Text>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>
          Bare imperative push (Step-5 target: no fallback flash)
        </Text>
        <Button
          testID="push-slow"
          title="push /slow (use promise)"
          onPress={() => router.push('/slow')}
        />
        <Button
          testID="push-lazy"
          title="push /lazy (bundle split)"
          onPress={() => router.push('/lazy')}
        />
        <Button
          testID="push-loader"
          title="push /loader (suspending loader)"
          onPress={() => router.push('/loader')}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>Caller startTransition (isPending probe)</Text>
        <Button
          testID="push-slow-transition"
          title="startTransition(push /slow)"
          onPress={() => startTransition(() => router.push('/slow'))}
        />
        {/* Spike item (e): does the caller's transition scope survive an `await` before the push?
            Watch `pending: true` persist across the await + router's own startTransition, or not. */}
        <Button
          testID="push-slow-async-transition"
          title="startTransition(async: await, then push /slow)"
          onPress={() =>
            startTransition(async () => {
              await Promise.resolve();
              router.push('/slow');
            })
          }
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>Links</Text>
        <Link testID="link-slow" href="/slow">
          Link to /slow
        </Link>
        <Link testID="link-tabs" href="/tabs">
          Link to /tabs (native interleaving)
        </Link>
        <Link testID="link-modal" href="/modal">
          Link to /modal
        </Link>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>Commit the held navigation</Text>
        <Button
          testID="resolve-delay"
          title="resolve delay (commit destination)"
          onPress={() => resolveDelay()}
        />
      </View>
    </ScrollView>
  );
}
