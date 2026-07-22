import { act, screen } from '@testing-library/react-native';
import { StrictMode, useEffect, useRef } from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/store';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import type { NavigationProp } from '../react-navigation/native';
import { useIsFocused } from '../react-navigation/native';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

type RootNavigation = NavigationProp<ReactNavigation.RootParamList>;

/**
 * Step 7 — StrictMode invariants (PLAN risk 10).
 *
 * StrictMode double-invokes reducers/renders and double-fires effects. What this file pins are the two
 * genuinely app-and-StrictMode-level facts:
 *
 *  (a) reducer PURITY under StrictMode's double-invoke: a single navigation dispatch, reduced twice by
 *      React's double reducer invocation, commits exactly ONE entry — a pure, deterministic reduction
 *      is not double-applied. The observable is the count of the destination in the COMMITTED TREE,
 *      not a mount-effect counter (StrictMode double-fires the destination's own mount effect too, so
 *      a `jest.fn` mount probe reports 4 and is confounded). A non-StrictMode control discriminates
 *      the double-invoke axis; an anti-pattern sibling discriminates the double-DISPATCH axis.
 *  (b) `getState()`/`deepFreeze` idempotency under interrupted (speculative) StrictMode renders — the
 *      "no `getState()` consumer has side effects" invariant.
 *
 * Scope note (verified empirically). The reducer's `pendingActions` field (the origin-unregistered
 * replay queue) is idempotent by action identity and already pinned at the reducer level
 * (`rootReducer.test.ios.ts` "reduceRootNavigation pendingActions"). It is NOT reachable through
 * app-level navigation: instrumenting the reducer shows every push here — even a descendant's focus
 * -effect push into a freshly-mounted nested stack — reduces as a plain synchronous root-handled PUSH
 * (`handled: true`, no `nestedBoundary`, no `isReplay`), because the origin navigator has already
 * registered by the time the effect runs. So there is no app-level `pendingActions`/mount-window-replay
 * -under-StrictMode pin to write; the reducer test is the honest home for that invariant, and the app
 * -level StrictMode fact that IS observable is reducer purity (a).
 *
 * Why the focus effect is ref-guarded in (a): a bare `useEffect(() => router.push('/x'), [])` is the
 * documented React anti-pattern of a non-idempotent side-effecting effect. StrictMode double-invokes
 * effects to surface exactly that, so it dispatches TWO distinct `router.push` calls (two distinct
 * -identity intents) that correctly commit TWO entries — PLAN D1's pinned "two identical pushes are
 * distinct objects and both land", NOT a router defect (target-dedup would silently swallow a genuine
 * double push). The ref guard removes that anti-pattern as a variable so (a) isolates reducer purity
 * (one dispatch, double-reduced, one commit); the anti-pattern itself is documented by the sibling.
 *
 * `renderRouter` forwards `options` to RNTL `render`, so `wrapper` installs StrictMode over the tree.
 */

function strictWrapper({ children }: { children: React.ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

/** Names in the deepest (inner) stack under `__root` -> outer-stack -> inner-stack. */
function innerNestedRouteNames(): string[] {
  const root = store.state;
  const outer = root?.routes[root.index ?? 0]?.state;
  const inner = outer?.routes[outer.index ?? 0]?.state;
  return (inner?.routes ?? []).map((r) => r.name);
}

// A nested app whose `inner/index` dispatches to `/inner/second` from its focus effect once the nested
// stack is focused. The push reduces as a plain synchronous PUSH (the nested navigator has registered
// by the time the effect runs). `guardEffect` optionally makes the focus-effect dispatch fire only
// once, isolating reducer purity (one dispatch, double-reduced by StrictMode) from the StrictMode
// double-FIRE of the user effect (two dispatches).
function renderNestedApp(options: { wrapper?: typeof strictWrapper; guardEffect: boolean }) {
  function InnerIndex() {
    const isFocused = useIsFocused();
    const pushed = useRef(false);
    useEffect(() => {
      if (!isFocused) {
        return;
      }
      if (options.guardEffect) {
        if (pushed.current) {
          return;
        }
        pushed.current = true;
      }
      router.push('/inner/second');
    }, [isFocused]);
    return <Text testID="inner-index">Inner Index</Text>;
  }

  return renderRouter(
    {
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
      'inner/_layout': () => <Stack />,
      'inner/index': InnerIndex,
      'inner/second': () => <Text testID="inner-second">Inner Second</Text>,
    },
    options.wrapper ? { wrapper: options.wrapper } : {}
  );
}

describe('reducer purity under StrictMode double-invoke (risk 10)', () => {
  it('commits a single dispatch exactly once despite StrictMode double-reducing it', () => {
    // The focus-effect dispatch is ref-guarded to one call. Under StrictMode React invokes the reducer
    // twice for that one dispatch; a pure, deterministic reduction commits exactly one `/inner/second`
    // entry (the second invocation reproduces the first, it does not append again).
    renderNestedApp({ wrapper: strictWrapper, guardEffect: true });

    act(() => router.push('/inner'));

    expect(screen.getByTestId('inner-second')).toBeVisible();
    expect(innerNestedRouteNames()).toEqual(['index', 'second']);
  });

  it('reaches the same single-entry state WITHOUT StrictMode (double-invoke control)', () => {
    // The same ref-guarded app without StrictMode reduces the one dispatch once and also commits a
    // single `second`. So a purity break under StrictMode's double-invoke (a second reduction that
    // appended again) would diverge from this control and fail the test above — this is the
    // discriminator for the double-INVOKE axis (the sibling below discriminates the double-DISPATCH axis).
    renderNestedApp({ guardEffect: true });

    act(() => router.push('/inner'));

    expect(screen.getByTestId('inner-second')).toBeVisible();
    expect(innerNestedRouteNames()).toEqual(['index', 'second']);
  });

  it('a non-idempotent focus-effect push commits twice under StrictMode — the anti-pattern, not a router defect', () => {
    // Without the ref guard, StrictMode double-FIRES `inner/index`'s focus effect, dispatching two
    // distinct `router.push('/inner/second')` calls that correctly commit two entries (PLAN D1). This
    // documents that the doubling is the user-code anti-pattern StrictMode is designed to surface — and
    // that the router must NOT dedupe genuine double pushes (which would break D1).
    renderNestedApp({ wrapper: strictWrapper, guardEffect: false });

    act(() => router.push('/inner'));

    expect(screen.getByTestId('inner-second')).toBeVisible();
    expect(innerNestedRouteNames()).toEqual(['index', 'second', 'second']);
  });
});

describe('getState()/deepFreeze idempotency under StrictMode (risk 10)', () => {
  it('getState() does not throw and returns a frozen committed slice under StrictMode double-render', () => {
    // `useNavigation().getState()` returns `deepFreeze(lastCommittedStateRef.current)`. Under
    // StrictMode the render (and getState call) runs twice; deepFreeze early-returns on an
    // already-frozen object, so the second freeze is a no-op — no throw, no side effect. (deepFreeze
    // is dev/test-only: a no-op under NODE_ENV==='production'; jest runs 'test', so it is active.)
    let capturedState: ReturnType<RootNavigation['getState']> | undefined;
    let renderCalls = 0;
    function Probe() {
      const navigation = useNavigation<RootNavigation>();
      renderCalls += 1;
      capturedState = navigation.getState();
      return <Text testID="index">Index</Text>;
    }

    renderRouter(
      {
        _layout: () => <Stack />,
        index: Probe,
      },
      { wrapper: strictWrapper }
    );

    // StrictMode double-rendered the probe (so the double-freeze path was exercised).
    expect(renderCalls).toBeGreaterThan(1);
    expect(capturedState).toBeDefined();
    // The returned committed slice is actually frozen — without this the "no throw" assertion would be
    // vacuously green if deepFreeze had silently become a no-op.
    expect(Object.isFrozen(capturedState)).toBe(true);
    expect(capturedState?.routes[0]?.name).toBe('index');
  });
});
