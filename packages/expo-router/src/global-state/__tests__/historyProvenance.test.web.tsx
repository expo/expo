import { act, renderHook } from '@testing-library/react-native';

import { getPathFromState } from '../../fork/getPathFromState';
import { getStateFromPath } from '../../fork/getStateFromPath';
import { getNavigationConfig } from '../../getLinkingConfig';
import { deepFreeze } from '../../react-navigation/core/deepFreeze';
import {
  StackRouter,
  type NavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { createSeededRootState } from '../createSeededNavigationState';
import { initialHistoryOrders, observeHistoryOrders } from '../historyOrder';
import type { RouterRegistryEntry } from '../routerRegistry';
import {
  navigationTreeReducer,
  useNavigationTreeReducer,
  type NavigationTreeResult,
} from '../useNavigationTreeReducer';
import { A, B, action, config, entry, keys, result, state } from './__fixtures__/historyOrder';
import { node } from './__fixtures__/routeNode';

function snapshots(): NavigationTreeResult {
  const initial = result();
  const next = action(initial, { type: 'JUMP_TO', payload: { name: 'baz' } }, config(B));
  const history = {
    entries: [
      { id: 'test:0', path: '/qux', state: initial.state },
      { id: 'test:1', path: '/baz', state: next.state },
    ],
    index: 1,
    idPrefix: 'test',
    entrySeq: 2,
  };
  return {
    ...next,
    report: undefined,
    history,
    historyOrders: observeHistoryOrders(
      new Map([...initial.historyOrders!, ...next.historyOrders!]),
      next.state,
      config(B).registry,
      history
    ),
  };
}

it.each([
  [A, ['bar']],
  [B, ['baz', 'bar']],
] as const)('restores saved REPLACE history with its original order: %j', (order, expected) => {
  const initial = snapshots();
  const saved = initial.history!.entries[0]!.state;
  const mounted = navigationTreeReducer(
    initial,
    { type: 'ROUTERS_REGISTERED' },
    config([...order])
  );
  expect(mounted.state).toBe(initial.state);
  expect(mounted.history).toBe(initial.history);
  expect(mounted.report).toBeUndefined();
  const operation = {
    type: 'BROWSER_HISTORY_CHANGED' as const,
    payload: { id: 'test:0', path: '/qux' },
  };
  const restored = navigationTreeReducer(deepFreeze(mounted), operation, config([...order]));
  expect(restored.state.history).toBe(saved.history);
  expect(restored.historyOrders!.get(saved.history!)?.order).toEqual(A);
  expect(keys(action(restored, { type: 'GO_BACK' }, config([...order])).state)).toEqual(expected);
  expect(navigationTreeReducer(mounted, operation, config([...order]))).toEqual(restored);
  expect(keys(saved)).toEqual(['bar', 'qux']);
  expect(JSON.stringify(restored.history)).not.toMatch(/historyOrders|declaredRouteNames|baseline/);
});

it('retains browser provenance across A-B-A and a temporarily absent navigator', () => {
  const initial = snapshots();
  const absent = navigationTreeReducer(
    initial,
    { type: 'ROUTERS_REGISTERED' },
    { ...config(B), registry: new Map() }
  );
  expect(absent.historyOrders!.size).toBe(2);
  const mounted = navigationTreeReducer(absent, { type: 'ROUTERS_REGISTERED' }, config(A));
  const restored = navigationTreeReducer(
    mounted,
    { type: 'BROWSER_HISTORY_CHANGED', payload: { id: 'test:0', path: '/qux' } },
    config(A)
  );
  expect(keys(action(restored, { type: 'GO_BACK' }, config(A)).state)).toEqual(['bar']);
});

it('restores a B-derived snapshot under A and prepares it only on accepted navigation', () => {
  const initial = snapshots();
  const selected = navigationTreeReducer(
    initial,
    { type: 'BROWSER_HISTORY_CHANGED', payload: { id: 'test:0', path: '/qux' } },
    config(A)
  );
  const restored = navigationTreeReducer(
    selected,
    { type: 'BROWSER_HISTORY_CHANGED', payload: { id: 'test:1', path: '/baz' } },
    config(A)
  );
  expect(restored.state.history).toBe(initial.state.history);
  const next = action(restored, { type: 'GO_BACK' }, config(A));
  expect(keys(next.state)).toEqual(['bar']);
});

it('discards interrupted navigation provenance with the committed tree result', () => {
  const committed = snapshots();
  const interrupted = action(committed, { type: 'JUMP_TO', payload: { name: 'qux' } }, config(B));
  const discarded = interrupted.state.history!;
  const operation = {
    type: 'BROWSER_HISTORY_CHANGED' as const,
    commitedTreeResult: committed,
    payload: { id: 'test:0', path: '/qux' },
  };
  const restored = navigationTreeReducer(interrupted, operation, config(A));
  expect(restored.historyOrders!.has(discarded)).toBe(false);
  expect(keys(action(restored, { type: 'GO_BACK' }, config(A)).state)).toEqual(['bar']);
  expect(navigationTreeReducer(interrupted, operation, config(A))).toEqual(restored);
  expect(restored.eventSeq).toBeGreaterThanOrEqual(interrupted.eventSeq);
});

it('prunes provenance when pushing drops browser forward entries', () => {
  const initial = snapshots();
  const forwardHistory = initial.state.history!;
  const selected = navigationTreeReducer(
    initial,
    { type: 'BROWSER_HISTORY_CHANGED', payload: { id: 'test:0', path: '/qux' } },
    config(A)
  );
  const next = action(
    selected,
    { type: 'JUMP_TO', payload: { name: 'baz' } },
    config(A, { backBehavior: 'history' })
  );
  expect(next.history!.entries.some((entry) => entry.id === 'test:1')).toBe(false);
  expect(next.historyOrders!.has(forwardHistory)).toBe(false);
  expect(initial.historyOrders!.has(forwardHistory)).toBe(true);
});

it('stamps URL-seeded absent history only when navigation computes it', () => {
  const input = { ...state(), history: undefined };
  const initial = result(input, config(B));
  expect(initial.historyOrders!.size).toBe(0);
  const next = action(
    initial,
    { type: 'SET_PARAMS', payload: { params: { fromUrl: true } } },
    config(B)
  );
  expect(keys(next.state)).toEqual(['baz', 'bar', 'qux']);
  expect(next.historyOrders!.get(next.state.history!)?.order).toEqual(B);
});

function unmountedTabsSnapshot(backBehavior: TabRouterOptions['backBehavior'] = 'order') {
  const oldNode = node('', [node('index'), node('tabs', [node('a'), node('b'), node('c')])]);
  const routeNode = node('', [node('index'), node('tabs', [node('a'), node('b')])]);
  const live = createSeededRootState(undefined, oldNode);
  const layout = live.routes[0]!.state as NavigationState;
  const tabs: NavigationState = {
    key: 'tabs',
    type: 'tab',
    stale: false,
    routeKeySeq: 3,
    routeNames: ['a', 'b', 'c'],
    index: 2,
    routes: ['a', 'b', 'c'].map((name) => ({ key: name, name, params: { visit: 'current' } })),
    history: ['a', 'b', 'c'].map((key) => ({ type: 'route', key, params: { visit: 'previous' } })),
  };
  const saved: NavigationState = {
    ...live,
    routes: [
      {
        ...live.routes[0]!,
        state: {
          ...layout,
          type: 'stack',
          index: 1,
          routes: [...layout.routes, { key: 'tabs:1', name: 'tabs', state: tabs }],
        },
      },
    ],
  };
  const stack = StackRouter({});
  const rootEntry: RouterRegistryEntry = {
    routerType: 'stack',
    reduce: (state, action) =>
      stack.getStateForAction(state as never, action as never, {
        routeNames: state.routeNames,
        routeGetIdList: {},
      }),
  };
  const registry = new Map([[live.key, rootEntry]]);
  const history = {
    entries: [
      { id: 'test:0', path: '/index', state: live },
      { id: 'test:1', path: '/tabs/c', state: saved },
    ],
    index: 0,
    idPrefix: 'test',
    entrySeq: 2,
  };
  const initial: NavigationTreeResult = {
    state: live,
    history,
    eventSeq: 0,
    report: undefined,
    historyOrders: observeHistoryOrders(
      initialHistoryOrders(saved),
      live,
      new Map([...registry, [tabs.key, entry(['a', 'b', 'c'], { backBehavior })]]),
      history
    ),
  };
  const current = {
    ...config(),
    registry,
    routeNode,
    linking: {
      prefixes: [],
      getPathFromState,
      getStateFromPath,
      config: getNavigationConfig(routeNode, true, { sitemap: false, notFound: false }),
    },
  };
  const changed = navigationTreeReducer(
    deepFreeze(initial),
    { type: 'ROUTE_CONFIG_CHANGED' },
    current
  );
  expect(changed.state).toBe(live);
  expect(changed.history).toBe(history);
  return { initial, changed, current, tabs, saved };
}

function restoredTabs(result: NavigationTreeResult): NavigationState {
  return result.state.routes[0]!.state!.routes[1]!.state as NavigationState;
}

it('retains unmounted browser restore adoption and the original history provenance after HMR', () => {
  const { initial, changed, current, tabs, saved } = unmountedTabsSnapshot();
  const operation = {
    type: 'BROWSER_HISTORY_CHANGED' as const,
    payload: { id: 'test:1', path: '/tabs/c' },
  };
  const restored = navigationTreeReducer(deepFreeze(changed), operation, current);
  const repaired = restoredTabs(restored);
  expect(repaired.routes[repaired.index]!.name).toBe('a');
  expect(keys(repaired)).toEqual(['a', 'b', 'a']);
  expect(restored.pendingRouteConfig?.has(tabs.key)).toBe(true);
  expect(restored.historyOrders!.get(repaired.history!)).toBe(
    initial.historyOrders!.get(tabs.history!)
  );
  expect(restored.historyOrders!.get(repaired.history!)?.baseline).toBeUndefined();
  expect(navigationTreeReducer(changed, operation, current)).toEqual(restored);
  expect(keys(tabs)).toEqual(['a', 'b', 'c']);
  expect(saved.routes[0]!.state!.routes[1]!.state).toBe(tabs);
  expect(initial.historyOrders!.has(repaired.history!)).toBe(false);
  expect(restored.history!.entries).toHaveLength(2);
  expect(restored.history!.index).toBe(1);
  expect(restored.history!.entrySeq).toBe(2);
  expect(restored.report!.events.filter((event) => event.type === 'browser-history')).toEqual([
    expect.objectContaining({ op: 'replace', path: '/tabs/a?visit=current' }),
  ]);
  expect(JSON.stringify(restored.state)).not.toMatch(/historyOrders|declaredRouteNames|baseline/);
});

it.each([
  ['order', ['a', 'b'], ['a'], false],
  ['order', ['b', 'a'], ['b', 'a'], true],
  ['history', ['a', 'b'], ['b', 'a'], true],
  ['fullHistory', ['a', 'b'], ['a', 'b', 'a'], true],
] as const)(
  'restores an unmounted %s navigator, adopts %j and reports a useful Back',
  (backBehavior, order, expected, canGoBack) => {
    const { changed, current, tabs } = unmountedTabsSnapshot(backBehavior);
    const restored = navigationTreeReducer(
      changed,
      {
        type: 'BROWSER_HISTORY_CHANGED',
        payload: { id: 'test:1', path: '/tabs/c' },
      },
      current
    );
    const adoptedEntry = entry([...order], { backBehavior });
    const mounted = {
      ...current,
      registry: new Map([...current.registry, [tabs.key, adoptedEntry]]),
    };
    const adopted = navigationTreeReducer(
      deepFreeze(restored),
      { type: 'ROUTERS_REGISTERED' },
      mounted
    );
    expect(keys(restoredTabs(adopted))).toEqual(expected);
    expect(adopted.pendingRouteConfig?.has(tabs.key)).toBe(false);
    if (backBehavior === 'fullHistory') {
      expect(adopted.state).toBe(restored.state);
      expect(adopted.history).toBe(restored.history);
      expect(adopted.report).toBe(restored.report);
    }
    const registeredRestore = navigationTreeReducer(
      changed,
      {
        type: 'BROWSER_HISTORY_CHANGED',
        payload: { id: 'test:1', path: '/tabs/c' },
      },
      mounted
    );
    expect(keys(restoredTabs(registeredRestore))).toEqual(expected);
    const repeated = navigationTreeReducer(adopted, { type: 'ROUTERS_REGISTERED' }, mounted);
    expect(repeated.state).toBe(adopted.state);
    expect(repeated.history).toBe(adopted.history);
    expect(repeated.historyOrders).toBe(adopted.historyOrders);
    expect(repeated.pendingRouteConfig).toBe(adopted.pendingRouteConfig);
    expect(repeated.report).toBe(adopted.report);
    expect(repeated).toEqual(adopted);
    expect(navigationTreeReducer(restored, { type: 'ROUTERS_REGISTERED' }, mounted)).toEqual(
      adopted
    );

    const test = renderHook(() =>
      useNavigationTreeReducer({
        initialState: adopted.state,
        routeNode: current.routeNode,
        registry: mounted.registry,
      })
    );
    expect(test.result.current.canNavigatorGoBack(tabs.key)).toBe(canGoBack);
    const before = test.result.current.state;
    act(() => test.result.current.handleAction({ type: 'GO_BACK', target: tabs.key }));
    const next = restoredTabs({ ...adopted, state: test.result.current.state });
    expect(next.routes[next.index]!.name).toBe(canGoBack ? 'b' : 'a');
    if (!canGoBack) expect(test.result.current.state).toBe(before);
    if (backBehavior === 'fullHistory') {
      expect(next.routes[next.index]!.params).toEqual({ visit: 'previous' });
      act(() => test.result.current.handleAction({ type: 'GO_BACK', target: tabs.key }));
      const earlier = restoredTabs({ ...adopted, state: test.result.current.state });
      expect(earlier.routes[earlier.index]!.name).toBe('a');
      expect(earlier.routes[earlier.index]!.params).toEqual({ visit: 'previous' });
    }
    expect(test.result.current.canNavigatorGoBack(tabs.key)).toBe(false);
  }
);

it.each([true, false])(
  'preserves a repaired browser history origin before RESET pruning (known: %s)',
  (known) => {
    const { changed, current, tabs } = unmountedTabsSnapshot();
    const origin = known ? changed.historyOrders!.get(tabs.history!)! : { key: tabs.key };
    const initial = { ...changed, historyOrders: new Map([[tabs.history!, origin]]) };
    const restored = navigationTreeReducer(
      deepFreeze(initial),
      {
        type: 'BROWSER_HISTORY_CHANGED',
        payload: { id: 'test:1', path: '/tabs/c' },
      },
      current
    );
    expect(restored.historyOrders!.get(restoredTabs(restored).history!)).toBe(origin);
  }
);

it('rolls back interrupted restore adoption before replaying the committed browser entry', () => {
  const { changed, current, tabs } = unmountedTabsSnapshot();
  const operation = {
    type: 'BROWSER_HISTORY_CHANGED' as const,
    payload: { id: 'test:1', path: '/tabs/c' },
  };
  const restored = navigationTreeReducer(changed, operation, current);
  const interrupted = navigationTreeReducer(
    restored,
    { type: 'ROUTERS_REGISTERED' },
    {
      ...current,
      registry: new Map([...current.registry, [tabs.key, entry(['b', 'a'])]]),
    }
  );
  const abandonedHistory = restoredTabs(interrupted).history!;
  const rollback = navigationTreeReducer(
    deepFreeze(interrupted),
    {
      ...operation,
      commitedTreeResult: changed,
    },
    current
  );
  expect(rollback.state).toEqual(restored.state);
  expect(rollback.history).toEqual(restored.history);
  expect(rollback.pendingRouteConfig).toEqual(restored.pendingRouteConfig);
  expect(rollback.historyOrders!.get(restoredTabs(rollback).history!)?.order).toEqual([
    'a',
    'b',
    'c',
  ]);
  expect(rollback.historyOrders!.has(abandonedHistory)).toBe(false);
  expect(interrupted.historyOrders!.has(abandonedHistory)).toBe(true);
  expect(rollback.eventSeq).toBeGreaterThan(interrupted.eventSeq);
});
