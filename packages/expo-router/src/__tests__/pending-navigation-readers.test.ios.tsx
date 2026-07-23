import { screen, act } from '@testing-library/react-native';
import { use } from 'react';
import { Text, View } from 'react-native';

import { Slot } from '../exports';
import { store } from '../global-state/store';
import {
  usePathname,
  useSegments,
  useLocalSearchParams,
  useGlobalSearchParams,
} from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import type { NavigationProp } from '../react-navigation/native';
import { renderRouter } from '../testing-library';
import { useFocusEffect } from '../useFocusEffect';
import { useNavigation } from '../useNavigation';

type RootNavigation = NavigationProp<ReactNavigation.RootParamList>;
type GetState = RootNavigation['getState'];

/**
 * Step 6 — what every state reader means during a pending navigation (D4).
 *
 * Post-flip (Step 5), a JS-initiated `router.push` is a `React.startTransition`; the imperative store
 * (`store.state`/`getRootState`) lags the rendered tree until the destination commits. The rule this
 * step pins: everything outside the reducer reads the last *committed* tree; only the reducer sees the
 * chained latest.
 *
 * Risk-9 discipline (see `transitions-characterization.test.ios.tsx`): the jest stack cannot observe a
 * mid-flight → recovery across separate acts. The observable shapes are (i) origin-still while a
 * controllable `use(promise)` destination stays pending across an awaited act, (ii) final committed
 * state when the promise resolves within the navigation act, (iii) same-tick reads captured inside the
 * act before it flushes. "What's on screen" is asserted via rendered-tree queries — NEVER via the
 * store-reading testing-library helpers (`getPathname`/`getSegments`/`getRouterState`/`toHavePathname`),
 * which lag by construction during a pending transition and would make these assertions tautological.
 */

/** A test-controlled promise: suspends `use(promise)` until resolved. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** The inner Stack navigator's key (the slice under the `__root` container that holds the screens). */
function innerStackKey(): string {
  const rootState = store.state;
  if (!rootState) {
    throw new Error('committed root state is not available');
  }
  const inner = rootState.routes[rootState.index ?? 0]?.state;
  if (!inner?.key) {
    throw new Error('inner stack slice has no key');
  }
  return inner.key;
}

// Route info hooks rendered into on-screen text so they can be read with rendered-tree queries
// (`toHaveTextContent`), the only mechanism that distinguishes "the rendered hook reports the origin"
// from "the store mirror lags" (the latter is true regardless and would be a tautology).
function RouteInfoProbe() {
  const pathname = usePathname();
  const segments = useSegments();
  const local = useLocalSearchParams();
  const global = useGlobalSearchParams();
  return (
    <View testID="origin">
      <Text testID="probe-pathname">{pathname}</Text>
      <Text testID="probe-segments">{JSON.stringify(segments)}</Text>
      <Text testID="probe-local">{JSON.stringify(local)}</Text>
      <Text testID="probe-global">{JSON.stringify(global)}</Text>
    </View>
  );
}

describe('rendered-tree route-info hooks lag committed while a push is pending (D4)', () => {
  it('usePathname/useSegments/useLocalSearchParams/useGlobalSearchParams keep reporting the origin while the destination suspends', () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Slot />,
        index: RouteInfoProbe,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    // Origin, committed.
    expect(screen.getByTestId('probe-pathname')).toHaveTextContent('/');
    expect(screen.getByTestId('probe-segments')).toHaveTextContent(JSON.stringify([]));

    // Push to a suspending destination: the transition keeps the origin mounted; every route-info
    // hook still reports the *committed* (pre-push) route, not the pending `/detail/7?q=1`.
    act(() => router.push('/detail/7?q=1'));

    expect(screen.getByTestId('probe-pathname')).toHaveTextContent('/');
    expect(screen.getByTestId('probe-segments')).toHaveTextContent(JSON.stringify([]));
    expect(screen.getByTestId('probe-local')).toHaveTextContent(JSON.stringify({}));
    expect(screen.getByTestId('probe-global')).toHaveTextContent(JSON.stringify({}));
    expect(screen.queryByTestId('detail')).toBeNull();
  });

  it('the hooks flip to the destination once the suspending promise resolves within the navigation act (falsifiability sibling)', async () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      const pathname = usePathname();
      const local = useLocalSearchParams();
      return (
        <View testID="detail">
          <Text testID="detail-pathname">{pathname}</Text>
          <Text testID="detail-local">{JSON.stringify(local)}</Text>
        </View>
      );
    }
    renderRouter(
      {
        _layout: () => <Slot />,
        index: RouteInfoProbe,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('probe-pathname')).toHaveTextContent('/');

    await act(async () => {
      router.push('/detail/7?q=1');
      deferred.resolve('ready');
    });

    // Proves the push genuinely reached the destination (the pending-window test above isn't a no-op),
    // and the hooks report the committed destination once it lands.
    expect(screen.getByTestId('detail-pathname')).toHaveTextContent('/detail/7');
    expect(screen.getByTestId('detail-local')).toHaveTextContent(JSON.stringify({ id: '7', q: '1' }));
    expect(screen.queryByTestId('origin')).toBeNull();
  });
});

describe('useNavigationBuilder.getState() returns the committed slice during a pending push (D4)', () => {
  it('getState() captured same-tick inside the push act reflects the committed (pre-push) tree', () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }

    let navigationGetState: GetState | undefined;
    function GetStateProbe() {
      // `useNavigation().getState` is the public `useNavigationBuilder.getState` surface.
      const navigation = useNavigation<RootNavigation>();
      navigationGetState = navigation.getState;
      return <Text testID="index">Index</Text>;
    }

    renderRouter(
      {
        _layout: () => <Stack />,
        index: GetStateProbe,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    const getState = navigationGetState!;
    const committedBefore = getState();
    expect(committedBefore?.routes).toHaveLength(1);
    expect(committedBefore?.routes[0]?.name).toBe('index');

    // Read getState() in the SAME tick as the push, before the transition commits. It returns the
    // last *committed* slice (advanced from a layout effect on the committed value), so it still shows
    // the single-entry stack — never the speculative pending render.
    let sameTickState: ReturnType<GetState> = committedBefore;
    act(() => {
      router.push('/detail/7');
      sameTickState = getState();
    });
    expect(sameTickState?.routes).toHaveLength(1);
    expect(sameTickState?.routes[0]?.name).toBe('index');
  });

  it('getState() flips to the two-entry committed stack once a push commits (falsifiability sibling)', () => {
    let navigationGetState: GetState | undefined;
    function GetStateProbe() {
      const navigation = useNavigation<RootNavigation>();
      navigationGetState = navigation.getState;
      return <Text testID="index">Index</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: GetStateProbe,
        'detail/[id]': () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    expect(navigationGetState!()?.routes).toHaveLength(1);

    // A non-suspending push commits within the act; getState() then reflects the two-entry committed
    // stack — proving the push genuinely reaches the router and the same-tick `1` above is meaningful
    // (not a silently no-op'd push).
    act(() => router.push('/detail/7'));
    const committedAfter = navigationGetState!();
    expect(committedAfter?.routes).toHaveLength(2);
    expect(committedAfter?.routes[1]?.name).toBe('detail/[id]');
  });
});

describe('router.canDismiss() answers for the committed tree within the same tick as a pending push (D1)', () => {
  it('canDismiss() reads the committed (pre-push) stack, matching canGoBack', () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    // Single-entry stack: nothing to dismiss on the committed tree.
    expect(router.canDismiss()).toBe(false);

    // A pending push to a suspending screen does not change what canDismiss() sees — it reads the last
    // committed tree, so it still answers `false` here (the push hasn't committed a second entry).
    // NOT wrapped in one act around both (that would flush the transition and make this a tautology).
    let sameTickCanDismiss: boolean | undefined;
    act(() => {
      router.push('/detail/7');
      sameTickCanDismiss = router.canDismiss();
    });
    expect(sameTickCanDismiss).toBe(false);
  });

  it('canDismiss() becomes true once a push commits a second entry (falsifiability sibling)', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        'detail/[id]': () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    expect(router.canDismiss()).toBe(false);

    // A non-suspending push commits within the act; canDismiss() then answers `true` — proving the
    // push genuinely makes the stack dismissable, so the same-tick `false` above is non-vacuous.
    act(() => router.push('/detail/7'));
    expect(router.canDismiss()).toBe(true);
  });
});

describe('useFocusEffect cleanup on the outgoing screen fires at commit, not while a push is pending (D4/E)', () => {
  // Two-sibling shape (risk-9): the fallback→content *recovery* across separate acts isn't observable
  // in this jest stack (see `transitions-characterization.test.ios.tsx`), so we can't push in one act
  // and observe the commit in a later one. Instead: one test holds the destination pending and asserts
  // the outgoing cleanup does NOT run; a sibling resolves the destination *within* the navigation act
  // and asserts the cleanup runs exactly once on commit — proving it is wired and blur-timed, so the
  // first test is not a vacuous "cleanup never runs".
  function Origin({ cleanup }: { cleanup: () => void }) {
    useFocusEffect(() => cleanup);
    return <Text testID="index">Index</Text>;
  }

  it('does not run the outgoing cleanup while the destination suspends', () => {
    const deferred = createDeferred<string>();
    const cleanup = jest.fn();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Origin cleanup={cleanup} />,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    expect(cleanup).not.toHaveBeenCalled();

    // The transition keeps the origin mounted and focused while `/detail/7` suspends, so its focus
    // effect keeps running — its cleanup must NOT fire while the destination is pending.
    act(() => router.push('/detail/7'));
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('detail')).toBeNull();
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('runs the outgoing cleanup once when the destination commits (falsifiability sibling)', async () => {
    const deferred = createDeferred<string>();
    const cleanup = jest.fn();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Origin cleanup={cleanup} />,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    expect(cleanup).not.toHaveBeenCalled();

    // Resolve within the navigation act: the destination commits, the origin blurs, cleanup runs once.
    await act(async () => {
      router.push('/detail/7');
      deferred.resolve('ready');
    });
    expect(screen.getByTestId('detail')).toBeVisible();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

// HrefPreview (audit reader, section A) reads `store.state` (the committed mirror) bare in a loop.
// There is no discriminating jest pin for a pending-window difference: its rendered output depends on
// the *static* registered `routeNames` (protection) and the compiled preview href, not on the mutable
// committed-vs-in-flight tree in a way a pending push can flip (the descent `findIndex` difference only
// affects the intermediate walk, never which component renders). The reader is committed-by-construction
// (`store.state` = committed mirror; correctness review confirmed the read is benign), so a jest test
// here would be a tautology. Left as an audit conclusion (Step-6.md §A / red-list 5), not a false test;
// the peek-during-a-real-gesture behavior is simulator territory (Step 9).

describe("the container 'state' event is commit-timed, not dispatch-timed (D4/E — backs URL/history sync)", () => {
  // Browser URL/history sync (`fork/useLinking.ts`) writes the URL from a listener on the container's
  // `'state'` event. That event fires from a passive effect keyed on the `useReducer` value, i.e. at
  // commit — so the URL stays at the committed value while a push suspends, matching the screen. Pin
  // the underlying mechanism platform-agnostically here (the web `window.location` render path through
  // `renderRouter` is not a supported jest combination — the URL-value pin itself is simulator-only,
  // Step 9); `onStateChange`/URL-sync both ride this event.
  // Two-sibling shape (risk-9: cross-act recovery isn't observable): one render holds the destination
  // pending and asserts no 'state' emit; a sibling resolves within the navigation act and asserts the
  // emit lands on commit (so the first isn't a vacuous "listener never fires").
  it("does not emit 'state' while a push is pending", () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    const onState = jest.fn();
    const unsubscribe = store.navigationRef.current!.addListener('state', onState);

    act(() => router.push('/detail/7'));
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('detail')).toBeNull();
    expect(onState).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("emits 'state' when the destination commits (falsifiability sibling)", async () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    const onState = jest.fn();
    const unsubscribe = store.navigationRef.current!.addListener('state', onState);

    await act(async () => {
      router.push('/detail/7');
      deferred.resolve('ready');
    });
    unsubscribe();
    expect(screen.getByTestId('detail')).toBeVisible();
    expect(onState).toHaveBeenCalled();
  });
});

describe('store.getCommittedSlice reads the committed tree during a pending push (D4 — backs tab first-visit)', () => {
  // The tab first-visit gate (`BottomTabBar`, native-tabs) reads `store.getCommittedSlice(key)` rather
  // than the rendered slice, so a speculatively-rendered-but-uncommitted tab is not treated as visited.
  // The store-level property is jest-able here; the tab-press *consumption* during a pending native tab
  // switch is native-tabs behavior verified on the simulator (Step 9).
  it('getCommittedSlice reflects the committed (pre-push) root while a push suspends', () => {
    const deferred = createDeferred<string>();
    function SuspendingDetail() {
      use(deferred.promise);
      return <Text testID="detail">Detail</Text>;
    }
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        'detail/[id]': SuspendingDetail,
      },
      { initialUrl: '/' }
    );

    // The Stack navigator (holding index/detail) is the inner slice under the `__root` container.
    const stackKey = innerStackKey();
    const committedBefore = store.getCommittedSlice(stackKey);
    expect(committedBefore?.routes).toHaveLength(1);
    expect(committedBefore?.routes[0]?.name).toBe('index');

    // Same tick as the push, before it commits: the committed slice is unchanged (still the single
    // `index` entry), not the speculative two-entry pending tree.
    let sameTickSlice = committedBefore;
    act(() => {
      router.push('/detail/7');
      sameTickSlice = store.getCommittedSlice(stackKey);
    });
    expect(sameTickSlice?.routes).toHaveLength(1);
    expect(sameTickSlice?.routes[0]?.name).toBe('index');
  });

  it('getCommittedSlice reflects the two-entry stack once a push commits (falsifiability sibling)', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        'detail/[id]': () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: '/' }
    );

    const stackKey = innerStackKey();
    expect(store.getCommittedSlice(stackKey)?.routes).toHaveLength(1);

    // A non-suspending push commits within the act; the committed slice then has two entries — proving
    // the push genuinely reaches the tree, so the same-tick single-entry read above is non-vacuous.
    act(() => router.push('/detail/7'));
    expect(store.getCommittedSlice(stackKey)?.routes).toHaveLength(2);
  });
});

describe('getSeedState isolation across sequential roots (D1 install lifecycle / F)', () => {
  it('a second renderRouter seeds from its own compiled state, not the first root committed mirror', () => {
    const first = renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="first-index">First</Text>,
        other: () => <Text testID="first-other">Other</Text>,
      },
      { initialUrl: '/other' }
    );
    expect(screen.getByTestId('first-other')).toBeVisible();
    first.unmount();

    // A fresh root at a different initial URL must seed from its own compiled state — unaffected by the
    // first root's committed mirror (which last saw `/other`).
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="second-index">Second</Text>,
        deep: () => <Text testID="second-deep">Deep</Text>,
      },
      { initialUrl: '/deep' }
    );
    expect(screen.getByTestId('second-deep')).toBeVisible();
    expect(screen.queryByTestId('first-other')).toBeNull();
  });
});
