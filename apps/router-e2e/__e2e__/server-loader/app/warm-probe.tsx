import { useLoaderData } from 'expo-router';
import { Suspense, use, type ReactNode } from 'react';
import { Text } from 'react-native';

export function loader() {
  return Promise.resolve({ warmed: true });
}

// Test-only gate. On the client, `Gate` suspends *above* the `useLoaderData` child, so on a client
// navigation the data-reading component does not render until the test releases the gate. A loader
// request that appears while the gate fallback is shown can therefore only have come from the
// navigation-commit warm (`loaderBootstrap`), never the render-time fallback in `useLoaderData`.
//
// The gate is bypassed during SSR/SSG (`typeof window === 'undefined'`) so prerendering this route
// doesn't hang. This route is reached via client navigation in the E2E only — never hydrated directly.
const gate = new Promise<void>((resolve) => {
  if (typeof window !== 'undefined') {
    (globalThis as any).__releaseWarmGate = resolve;
  }
});

function Gate({ children }: { children: ReactNode }) {
  if (typeof window !== 'undefined') {
    use(gate);
  }
  return <>{children}</>;
}

function WarmProbeScreen() {
  const data = useLoaderData<typeof loader>();
  return <Text testID="warm-result">{JSON.stringify(data)}</Text>;
}

export default function WarmProbeRoute() {
  return (
    <Suspense fallback={<Text testID="gate-fallback">gated</Text>}>
      <Gate>
        <WarmProbeScreen />
      </Gate>
    </Suspense>
  );
}
