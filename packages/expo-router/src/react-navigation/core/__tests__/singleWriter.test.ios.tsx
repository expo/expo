import { act, render } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import * as React from 'react';
import { use } from 'react';

import { store } from '../../../global-state/store';
import { NavigationSyncStateContext } from '../../../global-state/storeContext';
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

describe('single-writer invariant (store.setState only from dispatchRoot)', () => {
  it('has exactly one committed-store write, inside dispatchRoot', () => {
    const source = readCoreFile('BaseNavigationContainer.tsx');

    // The sync store's setter is only reachable here (it is the only `useSyncState` caller) and must
    // be invoked in exactly one place.
    const callSites = source.match(/\bsetState\(/g) ?? [];
    expect(callSites).toHaveLength(1);

    // ...and that one call site lives inside the `dispatchRoot` callback, not in a render path or
    // any other handler.
    const dispatchRootStart = source.indexOf('const dispatchRoot = useLatestCallback(');
    const dispatchRootEnd = source.indexOf('const dispatch = useLatestCallback(');
    expect(dispatchRootStart).toBeGreaterThan(-1);
    expect(dispatchRootEnd).toBeGreaterThan(dispatchRootStart);
    const dispatchRootBody = source.slice(dispatchRootStart, dispatchRootEnd);
    expect(dispatchRootBody).toContain('setState(result.state)');
  });

  it('is the only module that constructs the committed sync store', () => {
    // `useSyncState` mints the writable store; if it is only created in the container, no other
    // component can obtain the setter.
    const container = readCoreFile('BaseNavigationContainer.tsx');
    expect(container).toContain('useSyncState<');

    const sceneView = readCoreFile('SceneView.tsx');
    const builder = readCoreFile('useNavigationBuilder.tsx');
    expect(sceneView).not.toContain('useSyncState');
    expect(builder).not.toContain('useSyncState');
  });

  it('does not write to the store on a render with no navigation, only on dispatch', () => {
    const ref = createNavigationContainerRef<ParamListBase>();
    let syncStore: React.ContextType<typeof NavigationSyncStateContext> = null;

    function StoreProbe() {
      syncStore = use(NavigationSyncStateContext);
      return null;
    }

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
        <StoreProbe />
        <RootNavigator>
          <Screen name="foo">{() => null}</Screen>
          <Screen name="bar">{() => null}</Screen>
        </RootNavigator>
      </BaseNavigationContainer>
    );

    const root = render(makeTree());

    // Count actual committed writes via the store's own subscribers (fired on every `setState`),
    // which observes commits regardless of which reference invoked the setter.
    let commits = 0;
    const unsubscribe = syncStore!.subscribe(() => {
      commits += 1;
    });

    // A re-render with unchanged routes must not commit — the render path is not a writer.
    act(() => {
      root.update(makeTree());
    });
    expect(commits).toBe(0);

    // A dispatch is the only thing that writes.
    act(() => {
      ref.current?.dispatch({ type: 'REVERSE' });
    });
    expect(commits).toBe(1);

    unsubscribe();
  });
});

describe('store.state staleness window (Step 1 regression)', () => {
  it('reports the freshly committed state inside the state listener, not a lagging mirror', () => {
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
      store.navigationRef.current?.dispatch(
        require('../../routers').StackActions.push('b')
      );
    });
    unsubscribe();

    // The listener fires before the store's own `onStateChange` runs. Before Step 1, `store.state`
    // read a mirror updated only in that later callback, so it lagged `getRootState()` here. Now it
    // is a live read, so the two always agree.
    expect(observations.length).toBeGreaterThan(0);
    for (const { fromStore, fromRoot } of observations) {
      expect(fromStore).toEqual(fromRoot);
    }
  });
});
