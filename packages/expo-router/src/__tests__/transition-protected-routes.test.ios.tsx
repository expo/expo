import { act, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';

/**
 * Step 7 — a transition-wrapped push honors a route guard (PLAN Step 7).
 *
 * Protected routes are conditional render + guarded-route reset (`Stack.Protected guard={…}`),
 * independent of the removed prevent-remove surface (R1). The Step-7 question: post-flip a
 * JS-initiated `router.push` is a `React.startTransition`, so a push toward a guarded route must still
 * honor the guard — a blocked route never commits, an unblocked one does. These are final-committed
 * -state pins (rendered-tree queries); there is no pending window here (a single `router.push` settles
 * synchronously in one `act`), so this characterizes the guard's interaction with the transition-
 * wrapped push, not a pending-window behavior. The genuinely transition-specific case
 * (guard-flip *while* a navigation is pending) is simulator-only (risk 9): `protected.test.ios.tsx`
 * itself separates the guard-flip `act` from the navigate `act` ("TODO: Allow navigation events while
 * updating state"), which is the interleave that would need a mid-flight observation.
 */

describe('a transition-wrapped push honors a route guard (final state)', () => {
  it('a blocked guard never commits the guarded route — the push redirects to the anchor', () => {
    renderRouter(
      {
        _layout: function Layout() {
          // Guard stays false for the whole test: `/secret` is blocked.
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack>
          );
        },
        index: () => <Text testID="index">Index</Text>,
        secret: () => <Text testID="secret">Secret</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('index')).toBeVisible();

    // Push toward the guarded route. The push is a transition, but the guard is conditional render:
    // `/secret` is not registered, so the guarded-route reset redirects to the anchor (`/`). The
    // guarded screen never mounts.
    act(() => router.push('/secret'));

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('secret')).toBeNull();
    expect(screen).toHavePathname('/');
  });

  it('the same push commits the route once the guard is open (falsifiability sibling)', () => {
    let setGuard: Dispatch<SetStateAction<boolean>>;
    function Layout() {
      const [guard, set] = useState(false);
      setGuard = set;
      return (
        <Stack id={undefined}>
          <Stack.Protected guard={guard}>
            <Stack.Screen name="secret" />
          </Stack.Protected>
        </Stack>
      );
    }
    renderRouter(
      {
        _layout: Layout,
        index: () => <Text testID="index">Index</Text>,
        secret: () => <Text testID="secret">Secret</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('index')).toBeVisible();

    // Open the guard, then push: the guarded route now commits. This proves the push in the sibling
    // above genuinely targets `/secret` and the block there is the guard, not a broken push.
    act(() => setGuard(true));
    act(() => router.push('/secret'));

    expect(screen.getByTestId('secret')).toBeVisible();
    expect(screen).toHavePathname('/secret');
  });
});
