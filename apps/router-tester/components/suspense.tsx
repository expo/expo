import {
  Link,
  unstable_useIsNavigating,
  useIsFocused,
  usePathname,
  useRoute,
  useRouter,
  type Href,
} from 'expo-router';
import React, { use } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type SuspenseScreenConfig = {
  href: Href;
  title: string;
  /** Delay of the first render of a given route key, in milliseconds. */
  initial: number;
  /** Delay of every focus after the first one, in milliseconds. `0` never suspends again. */
  consecutive: number;
};

export const SUSPENSE_SCREENS: SuspenseScreenConfig[] = [
  {
    href: '/suspense/initial-5s',
    title: 'initial: 5s, consecutive: 0',
    initial: 5000,
    consecutive: 0,
  },
  {
    href: '/suspense/initial-200ms',
    title: 'initial: 200ms, consecutive: 0',
    initial: 200,
    consecutive: 0,
  },
  {
    href: '/suspense/initial-200ms-consecutive-200ms',
    title: 'initial: 200ms, consecutive: 200ms',
    initial: 200,
    consecutive: 200,
  },
  {
    href: '/suspense/initial-5s-consecutive-5s',
    title: 'initial: 5s, consecutive: 5s',
    initial: 5000,
    consecutive: 5000,
  },
  {
    href: '/suspense/initial-200ms-consecutive-5s',
    title: 'initial: 200ms, consecutive: 5s',
    initial: 200,
    consecutive: 5000,
  },
];

type SuspenseRecord = {
  /**
   * The promise the screen waits on. It stays the same instance once resolved, so `use` returns
   * right away until a new focus replaces it.
   */
  promise: Promise<void>;
  focusCount: number;
  isFocused: boolean;
};

/** Keyed by navigation route key, so a new push of the same route suspends again. */
const records = new Map<string, SuspenseRecord>();

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function getRecord(routeKey: string, initial: number): SuspenseRecord {
  let record = records.get(routeKey);
  if (!record) {
    record = { promise: delay(initial), focusCount: 0, isFocused: false };
    records.set(routeKey, record);
  }
  return record;
}

/**
 * Suspends on the first render of a route key for `initial` ms, and on every focus after that for
 * `consecutive` ms.
 */
function useSuspendOnFocus(initial: number, consecutive: number): SuspenseRecord {
  const routeKey = useRoute().key;
  // Re-renders the screen on focus and on blur, which is what drives the logic below.
  const isFocused = useIsFocused();
  const record = getRecord(routeKey, initial);

  // A screen also re-renders for reasons other than focus, so only the blurred -> focused
  // transition starts a new delay. Without that guard the render after the promise resolves would
  // start another one and the screen would never settle.
  if (isFocused !== record.isFocused) {
    record.isFocused = isFocused;
    if (isFocused) {
      record.focusCount += 1;
      if (record.focusCount > 1 && consecutive > 0) {
        record.promise = delay(consecutive);
      }
    }
  }

  use(record.promise);
  return record;
}

function formatDelay(delay: number) {
  if (delay === 0) return '0';
  return delay >= 1000 ? `${delay / 1000}s` : `${delay}ms`;
}

export function SuspenseScreen({ initial, consecutive }: { initial: number; consecutive: number }) {
  const record = useSuspendOnFocus(initial, consecutive);
  const pathname = usePathname();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      contentInsetAdjustmentBehavior="automatic">
      <Text>Current Path: {pathname}</Text>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Initial: {formatDelay(initial)}</Text>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>
        Consecutive: {formatDelay(consecutive)}
      </Text>
      <Text>Focus count: {record.focusCount}</Text>
      <SuspenseLinks />
    </ScrollView>
  );
}

export function SuspenseLinks() {
  // True while a navigation is queued or its state update is pending. The screen that started the
  // navigation stays visible while the destination suspends, so this is where it shows up.
  const isNavigating = unstable_useIsNavigating();

  return (
    <View style={{ gap: 12 }}>
      {/* Rendered even when idle so the list below does not jump. */}
      <Text style={{ fontSize: 12, minHeight: 16 }}>{isNavigating ? 'Loading...' : ''}</Text>
      {SUSPENSE_SCREENS.map((screen) => (
        <View key={String(screen.href)} style={{ gap: 4 }}>
          <Text>{screen.title}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LinkButton href={screen.href} text="navigate" />
            <PreloadButton href={screen.href} />
          </View>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <BackButton />
        <LinkButton href="/suspense" text="Suspense index" />
      </View>
    </View>
  );
}

function LinkButton({ href, text }: { href: Href; text: string }) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: 'rgb(11, 103, 175)',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
      {text}
    </Link>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="back"
      onPress={() => router.back()}
      style={{ backgroundColor: 'rgb(66, 66, 66)', padding: 12, borderRadius: 8 }}>
      <Text style={{ color: '#fff' }}>back</Text>
    </Pressable>
  );
}

function PreloadButton({ href }: { href: Href }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="preload"
      onPress={() => router.prefetch(href)}
      style={{ backgroundColor: 'rgb(94, 53, 177)', padding: 12, borderRadius: 8 }}>
      <Text style={{ color: '#fff' }}>preload</Text>
    </Pressable>
  );
}
