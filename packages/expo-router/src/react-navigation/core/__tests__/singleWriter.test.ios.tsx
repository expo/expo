import { act, render } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';

import { router } from '../../../imperative-api';
import { store } from '../../../global-state/store';
import { renderRouter } from '../../../testing-library';
import {
  type DefaultRouterOptions,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey, type MockActions } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

const coreDir = path.join(__dirname, '..');
const readCoreFile = (file: string) => fs.readFileSync(path.join(coreDir, file), 'utf8');

// A router with a deterministic, always-handled action so a dispatch reliably commits a new state.
function ReversingRouter(options: DefaultRouterOptions) {
  const base = MockRouter(options);
  const router: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
    ...base,
    getStateForAction(state, action, opts) {
      if (action.type === 'REVERSE') {
        return { ...state, routes: state.routes.slice().reverse() };
      }
      return base.getStateForAction(state, action, opts);
    },
  };
  return router;
}

// Post the Step-5 transitions flip the navigation tree is React state at the root: the only writer is
// the container's root `useReducer` (`rootDispatch`), fed by the single `dispatchRoot` funnel. There
// is no committed sync store and no per-navigator setter — navigators render from the handed slice.
describe('single-writer invariant (only the root useReducer writes the tree)', () => {
  it('routes every write through the one dispatch funnel, with no sync-store setter left', () => {
    const container = readCoreFile('BaseNavigationContainer.tsx');

    // The authoritative reducer is dispatched from exactly one funnel.
    const dispatchCallSites = container.match(/\brootDispatch\(/g) ?? [];
    expect(dispatchCallSites.length).toBeGreaterThan(0);
    const dispatchRootStart = container.indexOf('const dispatchRoot = useLatestCallback(');
    const dispatchRootEnd = container.indexOf('// Replay actions held during the mount window');
    expect(dispatchRootStart).toBeGreaterThan(-1);
    expect(dispatchRootEnd).toBeGreaterThan(dispatchRootStart);
    const dispatchRootBody = container.slice(dispatchRootStart, dispatchRootEnd);
    // Every `rootDispatch` call lives inside the funnel (transition-wrapped or urgent).
    expect(dispatchRootBody.match(/\brootDispatch\(/g) ?? []).toHaveLength(dispatchCallSites.length);

    // The retired sync store is gone: no `useSyncState`, no per-navigator store setter.
    expect(container).not.toContain('useSyncState');
    const sceneView = readCoreFile('SceneView.tsx');
    const builder = readCoreFile('useNavigationBuilder.tsx');
    expect(sceneView).not.toContain('useSyncState');
    expect(builder).not.toContain('useSyncState');
  });

  it('does not commit a new tree on a render with no navigation, only on dispatch', () => {
    const ref = createNavigationContainerRef<ParamListBase>();

    const RootNavigator = (props: any) => {
      const { state, descriptors, NavigationContent } = useNavigationBuilder(
        ReversingRouter,
        props
      );
      return (
        <NavigationContent>
          {state.routes.map((route) => descriptors[route.key]!.render())}
        </NavigationContent>
      );
    };

    // A fresh element each call so `root.update` genuinely re-renders (rather than bailing on an
    // identical element), while keeping the route structure unchanged.
    const makeTree = () => (
      <BaseNavigationContainer
        ref={ref}
        initialState={{
          stale: false as const,
          index: 0,
          key: '0',
          routeNames: ['foo', 'bar'],
          routes: [
            { key: 'foo', name: 'foo' },
            { key: 'bar', name: 'bar' },
          ],
        }}>
        <RootNavigator>
          <Screen name="foo">{() => null}</Screen>
          <Screen name="bar">{() => null}</Screen>
        </RootNavigator>
      </BaseNavigationContainer>
    );

    const root = render(makeTree());

    // The committed tree is observed via the ref's `getRootState()` identity — a re-render with
    // unchanged routes reduces nothing, so the committed tree keeps its identity.
    const before = ref.current?.getRootState();

    act(() => {
      root.update(makeTree());
    });
    expect(ref.current?.getRootState()).toBe(before);

    // A dispatch is the only thing that commits a new tree.
    act(() => {
      ref.current?.dispatch({ type: 'REVERSE' });
    });
    const after = ref.current?.getRootState();
    expect(after).not.toBe(before);
    expect(after?.routes.map((r) => r.name)).toEqual(['bar', 'foo']);
  });
});

describe('store.state during the transitions flip', () => {
  it('agrees with getRootState() inside the state listener (both read the committed mirror)', () => {
    renderRouter(
      {
        _layout: () => {
          const Stack = require('../../../layouts/StackClient').default;
          return <Stack />;
        },
        a: () => null,
        b: () => null,
      },
      { initialUrl: '/a' }
    );

    const observations: { fromStore: string; fromRoot: string }[] = [];
    const unsubscribe = store.navigationRef.addListener('state', () => {
      observations.push({
        fromStore: JSON.stringify(store.state),
        fromRoot: JSON.stringify(store.navigationRef.current?.getRootState()),
      });
    });

    act(() => {
      store.navigationRef.current?.dispatch(require('../../routers').StackActions.push('b'));
    });
    unsubscribe();

    // Post-flip `store.state` reads the committed mirror (published from the container's commit
    // effect, before the `'state'` event fires) and `getRootState()` reads the same mirror, so the
    // two always agree inside the listener. During a pending transition both answer for the committed
    // (pre-transition) tree — the imperative store no longer leads render (a deliberate change).
    expect(observations.length).toBeGreaterThan(0);
    for (const { fromStore, fromRoot } of observations) {
      expect(fromStore).toEqual(fromRoot);
    }
  });

  it('same-tick push(); canGoBack() answers for the committed (pre-push) tree', () => {
    renderRouter(
      {
        _layout: () => {
          const Stack = require('../../../layouts/StackClient').default;
          return <Stack />;
        },
        index: () => null,
        next: () => null,
      },
      { initialUrl: '/' }
    );

    // On the initial (single) screen the imperative store cannot go back.
    expect(router.canGoBack()).toBe(false);

    // Dispatch the push and read `canGoBack()` back-to-back in the SAME synchronous scope, before the
    // enclosing `act` flushes the transition on exit. The flip moves the commit off the synchronous
    // dispatch path — `router.push` is wrapped in `React.startTransition` and the store is a
    // commit-time mirror — so the imperative store still reflects the pre-push (committed) tree at the
    // moment of the read: `canGoBack()` is still false. This is the documented behavior change
    // (pre-flip the sync store led render, so this same-tick read answered post-push).
    let canGoBackSameTick: boolean | undefined;
    act(() => {
      router.push('/next');
      canGoBackSameTick = router.canGoBack();
    });
    expect(canGoBackSameTick).toBe(false);

    // Once the transition has committed (the `act` above flushed it on exit), the store catches up and
    // back becomes possible.
    expect(router.canGoBack()).toBe(true);
  });
});
