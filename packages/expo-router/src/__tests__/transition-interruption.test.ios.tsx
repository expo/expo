import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { store } from '../global-state/store';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { renderRouter } from '../testing-library';

/**
 * Step 7 — interruption + mixed-priority matrix (PLAN risk 4), the JEST-ABLE half.
 *
 * Risk-9 discipline (empirically confirmed while writing these — see the note below): this jest stack
 * cannot observe a mid-flight transition window. Two facts fell out of the exploration and shape what
 * this file can honestly pin:
 *
 *  - When two navigations are dispatched and settle **within one awaited `act`**, the act flushes the
 *    transitions to completion and the FINAL committed state is the reducer's chained result in
 *    dispatch order. This is jest-able and is what the tests below assert.
 *  - When a first push is left GENUINELY PENDING across a *separate* act (its suspending destination
 *    uncommitted) and a second navigation interleaves in a later act, the committed result lands in
 *    the mid-flight regime that risk 9 declares unobservable: a scratch probe showed `push('/a')`
 *    (pending) then `push('/b')` + resolve in a later act commits NEITHER — final state `['index']`,
 *    not `['index','a','b']`. That supersede/abandon behavior is SIMULATOR-ONLY (Step 9); it is the
 *    interleave the PLAN's supersede-vs-flush decision covers, whose id-accounting carrier is Step 8.
 *    So we do NOT assert a separate-act pending interleave here — it would be a mid-flight assertion.
 *
 * Consequence, stated plainly: the suspending fixture would be inert for a single-act final-state
 * assertion (the act flushes it regardless), so these tests pin the interleave as SYNCHRONOUS reducer
 * chaining in one act — the honest jest surface. The suspending/pending interleave is the simulator's
 * job. Falsifiability comes from the two navigations landing distinct asserted destinations (a dropped
 * or misordered reduction fails the final-state assertion).
 */

function committedRouteNames(): string[] {
  const root = store.state;
  const inner = root?.routes[root.index ?? 0]?.state;
  return (inner?.routes ?? []).map((r) => r.name);
}

describe('a second navigation interleaved with a first, settled in one act (risk 4 — final state)', () => {
  it('chains two pushes in dispatch order', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        a: () => <Text testID="a">A</Text>,
        b: () => <Text testID="b">B</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('index')).toBeVisible();

    // Two pushes interleaved in one act reduce against the chained tree in dispatch order; neither is
    // lost. The distinct asserted destinations (index -> a -> b, `/b` on top) make a dropped or
    // reordered reduction fail — not a tautology on the stack contents.
    act(() => {
      router.push('/a');
      router.push('/b');
    });

    expect(screen.getByTestId('b')).toBeVisible();
    expect(committedRouteNames()).toEqual(['index', 'a', 'b']);
  });

  it('does not reorder when the second push targets an existing entry', () => {
    // Falsifiability partner to the above: pushing `/a` then `/a` again chains two distinct `/a`
    // entries (PLAN D1 "two identical pushes both land") — so the first test's ordering is a genuine
    // dispatch-order result, not a set-union that would collapse duplicates.
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        a: () => <Text testID="a">A</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      router.push('/a');
      router.push('/a');
    });

    expect(committedRouteNames()).toEqual(['index', 'a', 'a']);
  });
});

describe('router.back() interleaved with a push, settled in one act (risk 4 — final state)', () => {
  it('a push then back in one act lands on the origin', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        detail: () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('index')).toBeVisible();

    // GO_BACK reduces against the chained tree (index -> detail), pops detail, final = origin. Whether
    // a pending `/detail` ever painted between the push and the back is simulator-only (risk 9).
    act(() => {
      router.push('/detail');
      router.back();
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(committedRouteNames()).toEqual(['index']);
  });

  it('a push alone (no back) commits the destination — falsifiability sibling', () => {
    // Proves the back above is what undoes the push, not a dropped push: the same push without the
    // back commits `/detail`.
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        detail: () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => router.push('/detail'));

    expect(screen.getByTestId('detail')).toBeVisible();
    expect(committedRouteNames()).toEqual(['index', 'detail']);
  });
});
