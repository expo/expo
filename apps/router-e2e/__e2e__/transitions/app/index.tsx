import { Link, router, useLinkStatus, useNavigationTransitionPending } from 'expo-router';
import { useTransition } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

import { resolveDelay } from '../components/delay';

// Playground index for Step-9 on-device verification. The origin screen stays mounted through a
// pending transition (post-flip), so the pending readouts below are observable for the whole window.
// It surfaces both shipped pending hooks (useNavigationTransitionPending, useLinkStatus) plus a
// caller-side useTransition probe kept from Step 3 for the async-scope characterization (spike e).

// Reads the nearest Link's status. MUST render inside a <Link>'s children — useLinkStatus reads a
// context provided by the Link; outside one it silently returns { pending: false }.
function LinkStatusDot({ testID }: { testID: string }) {
  const { pending } = useLinkStatus();
  return <Text testID={testID}>link-pending: {String(pending)}</Text>;
}

export default function Index() {
  const [isPending, startTransition] = useTransition();
  const globalPending = useNavigationTransitionPending();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text testID="index-title" style={{ fontSize: 18, fontWeight: '600' }}>
        Transitions playground
      </Text>
      {/* Global pending signal (item 1): true from a JS push until its suspending destination commits. */}
      <Text testID="global-pending-readout">global-pending: {String(globalPending)}</Text>
      {/* Caller-side useTransition probe (spike e): async-scope survival across an await. */}
      <Text testID="pending-readout">caller-isPending: {String(isPending)}</Text>

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
            Watch `caller-isPending: true` persist across the await + router's own startTransition. */}
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
        <Text style={{ fontWeight: '600' }}>Links (item 2: per-Link useLinkStatus)</Text>
        {/* useLinkStatus dot rendered INSIDE the Link's children — the only place it reads a status. */}
        <Link testID="link-slow" href="/slow">
          <Text>Link to /slow </Text>
          <LinkStatusDot testID="link-slow-status" />
        </Link>
        <Link testID="link-tabs" href="/tabs">
          Link to /tabs (native interleaving)
        </Link>
        <Link testID="link-modal" href="/modal">
          Link to /modal
        </Link>
        {/* Items 4/5: peek-and-pop preview. useLinkStatus stays false here (navigation commits from a
            native callback, not the tracked press); HrefPreview renders the committed tree. */}
        <Link testID="link-preview-slow" href="/slow">
          <Link.Trigger>
            <Text>Link.Preview to /slow </Text>
            <LinkStatusDot testID="link-preview-status" />
          </Link.Trigger>
          <Link.Preview />
        </Link>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>Commit the held navigation</Text>
        {/* Per-key resolve: item 3 (supersede) holds two navigations pending at once; resolving all
            at once destroys the ordering, so resolve one key at a time. */}
        <Button testID="resolve-slow" title="resolve /slow" onPress={() => resolveDelay('slow')} />
        <Button testID="resolve-lazy" title="resolve /lazy" onPress={() => resolveDelay('lazy')} />
        <Button
          testID="resolve-loader"
          title="resolve /loader"
          onPress={() => resolveDelay('loader')}
        />
        <Button
          testID="resolve-delay"
          title="resolve all (commit every held destination)"
          onPress={() => resolveDelay()}
        />
      </View>
    </ScrollView>
  );
}
