import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useNavigationTransitionPending } from '../hooks/useNavigationTransitionPending';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { Link } from '../link/Link';
import { useLinkStatus } from '../link/useLinkStatus';
import { renderRouter } from '../testing-library';

/**
 * Step 8 — the pending-state API (D3). Jest pins the API shape, the settled (`false`) state, and the
 * same-tick-inside-act truthy capture; mid-flight `pending: true` DURATION is simulator-only (risk 9).
 *
 * The truthy capture is the primary pin and doubles as the regression proof that `lastIssued` is
 * bumped URGENTLY, outside the `React.startTransition` scope: after `router.push` inside an act,
 * `lastIssued` has advanced but the transition carrying `lastReduced` has not committed, so
 * `useNavigationTransitionPending()` renders `true`. If it read `false`, the id bump would be trapped
 * inside the transition — a bug, not a reclassification.
 */

// Renders the hook value into testID text AND records every rendered value into a closure array, so a
// same-tick (pre-flush) render of a truthy value is observable even if a later commit clears it.
function makePendingProbe() {
  const seen: boolean[] = [];
  function PendingProbe() {
    const pending = useNavigationTransitionPending();
    seen.push(pending);
    return <Text testID="pending">{pending ? 'pending' : 'idle'}</Text>;
  }
  return { PendingProbe, seen };
}

describe('useNavigationTransitionPending (global)', () => {
  it('is idle at rest, true same-tick after a push, and idle again once settled', () => {
    const { PendingProbe, seen } = makePendingProbe();

    renderRouter(
      {
        _layout: () => (
          <>
            <PendingProbe />
            <Stack />
          </>
        ),
        index: () => <Text testID="index">Index</Text>,
        detail: () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('pending')).toHaveTextContent('idle');

    act(() => {
      router.push('/detail');
    });

    // Some render during the push observed `pending: true` (the urgent `lastIssued` bump landed ahead
    // of the deferred transition commit). This is the load-bearing regression pin for the
    // urgent-outside-transition split.
    expect(seen).toContain(true);

    // Settled: the transition committed, `lastReduced` caught up, indicator idle. Falsifiability
    // sibling to the truthy capture — if `pending` never cleared, this fails.
    expect(screen.getByTestId('detail')).toBeVisible();
    expect(screen.getByTestId('pending')).toHaveTextContent('idle');
  });

  it('returns false when called outside a navigation container', () => {
    function Probe() {
      return <Text testID="bare">{String(useNavigationTransitionPending())}</Text>;
    }
    render(<Probe />);
    expect(screen.getByTestId('bare')).toHaveTextContent('false');
  });
});

describe('useLinkStatus (per-Link)', () => {
  it('is { pending: false } at rest inside a Link', () => {
    function Status() {
      const { pending } = useLinkStatus();
      return <Text testID="link-status">{pending ? 'pending' : 'idle'}</Text>;
    }

    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => (
          <Link href="/detail">
            <Status />
          </Link>
        ),
        detail: () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('link-status')).toHaveTextContent('idle');
  });

  it('captures its own navigation same-tick when pressed (pending true during the push)', () => {
    // The per-Link mechanism (ruling 1): a press mints an id the Link adopts, so `pending` goes true
    // for its own navigation in the same urgent window the global hook uses. Same falsifiability as
    // the global truthy pin — `seen` must contain `true`, and it would not if `trackPress` failed to
    // adopt the minted id (the whole point of ruling 1's per-Link backing).
    const seen: boolean[] = [];
    function Status() {
      const { pending } = useLinkStatus();
      seen.push(pending);
      return <Text testID="link-status">{pending ? 'pending' : 'idle'}</Text>;
    }

    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => (
          <Link href="/detail" testID="link">
            <Status />
          </Link>
        ),
        detail: () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      fireEvent.press(screen.getByTestId('link'));
    });

    expect(seen).toContain(true);
    expect(screen.getByTestId('detail')).toBeVisible();
  });

  it('returns the { pending: false } fallback outside any Link (proves it reads context)', () => {
    // Falsifiability sibling: rendered with no parent Link, the hook falls back to the context
    // default — so the "idle" above comes from the Link's provider, not a hardcoded return.
    function Status() {
      const { pending } = useLinkStatus();
      return <Text testID="bare-status">{String(pending)}</Text>;
    }
    render(<Status />);
    expect(screen.getByTestId('bare-status')).toHaveTextContent('false');
  });
});
