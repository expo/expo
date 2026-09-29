import { deepFreeze } from '../../react-navigation/core/deepFreeze';
import {
  StackRouter,
  type NavigationAction,
  type NavigationState,
} from '../../react-navigation/routers';
import { createSeededRootState } from '../createSeededNavigationState';
import { initialHistoryOrders, observeHistoryOrders, recordHistoryResult } from '../historyOrder';
import { navigationTreeReducer } from '../useNavigationTreeReducer';
import { A, B, action, config, entry, keys, result, state } from './__fixtures__/historyOrder';
import { node } from './__fixtures__/routeNode';

it.each([[A], [B]])(
  'retains truncated histories for equivalent registrations and A-B-A without navigation: %j',
  (order) => {
    const initial = result(state(), config(order));
    const changed = navigationTreeReducer(
      initial,
      { type: 'ROUTERS_REGISTERED' },
      config(order === A ? B : A)
    );
    const restored = navigationTreeReducer(
      changed,
      { type: 'ROUTERS_REGISTERED' },
      config([...order])
    );
    expect(restored.state).toBe(initial.state);
    expect(restored.historyOrders).toBe(initial.historyOrders);
    expect(restored.report).toBeUndefined();
    const back = action(restored, { type: 'GO_BACK' }, config(order));
    expect(back.state.routes[back.state.index]!.name).toBe('bar');
  }
);

it('leaves history and provenance intact after unhandled, targeted-null, and prevented attempts', () => {
  const initial = result();
  const changed = config(B);
  const untargeted = action(initial, { type: 'UNKNOWN' }, changed);
  const targeted = action(initial, { type: 'UNKNOWN', target: 'root' }, changed);
  for (const value of [untargeted, targeted]) {
    expect(value.state).toBe(initial.state);
    expect(value.historyOrders).toBe(initial.historyOrders);
  }
  const real = changed.registry.get('root')!;
  const prevented = action(
    initial,
    { type: 'REMOVE' },
    {
      ...changed,
      routesWithRemovalPrevented: new Set(['bar']),
      registry: new Map([
        [
          'root',
          {
            ...real,
            reduce: (state) => ({
              state: { ...state, routes: state.routes.slice(1), index: 1 },
              affectedRouteKey: 'qux',
            }),
          },
        ],
      ]),
    }
  );
  expect(prevented.state).toBe(initial.state);
  expect(prevented.historyOrders).toBe(initial.historyOrders);
  expect(prevented.report?.events.map((event) => event.type)).toEqual(['prevented-routes']);
});

it('does not rebaseline an unknown internally allocated history through registration or RESET', () => {
  const initial = result();
  const unknown = { ...initial.state, history: [...initial.state.history!] };
  const retained = observeHistoryOrders(initial.historyOrders!, unknown, config(B).registry);
  const observed = navigationTreeReducer(
    { ...initial, state: unknown, historyOrders: retained },
    { type: 'ROUTERS_REGISTERED' },
    config(B)
  );
  expect(observed.historyOrders!.get(unknown.history)?.order).toBeUndefined();
  const reset = action(observed, { type: 'RESET', payload: unknown }, config(B));
  const back = action(reset, { type: 'GO_BACK' }, config(B));
  expect(back.state.routes[back.state.index]!.name).toBe('bar');
  expect(keys(back.state)).toEqual(['baz', 'bar']);
});

it('preserves supplied initial and external RESET truncation, including deferred registration', () => {
  const input = state();
  const unregistered = { ...result(input), historyOrders: initialHistoryOrders(input) };
  const mounted = navigationTreeReducer(unregistered, { type: 'ROUTERS_REGISTERED' }, config(B));
  expect(mounted.state).toBe(input);
  expect(keys(action(mounted, { type: 'GO_BACK' }, config(B)).state)).toEqual(['bar']);
  const external = {
    ...state(),
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'qux' },
    ],
  };
  const reset = action(mounted, { type: 'RESET', payload: external }, config(B));
  expect(keys(action(reset, { type: 'GO_BACK' }, config(B)).state)).toEqual(['baz']);
});

it('retains known nested RESET payload history rather than stamping it current', () => {
  const child = { ...state(), key: 'child' };
  const input = {
    ...state(),
    type: 'stack',
    index: 0,
    routes: [{ key: 'parent', name: 'bar', state: child }],
    history: undefined,
  };
  const stack = StackRouter({});
  const configuration = {
    ...config(),
    registry: new Map([
      [
        'root',
        {
          reduce: (state: NavigationState, action: NavigationAction) =>
            stack.getStateForAction(state as never, action as never, {
              routeNames: A,
              routeGetIdList: {},
            }),
        },
      ],
      ['child', entry(A)],
    ]),
  };
  const initial = result(input, configuration);
  const updated = {
    ...configuration,
    registry: new Map([...configuration.registry, ['child', entry(B)]]),
  };
  const reset = action(initial, { type: 'RESET', target: 'root', payload: input }, updated);
  const backed = action(reset, { type: 'GO_BACK', target: 'child' }, updated);
  expect(keys(backed.state.routes[0]!.state as NavigationState)).toEqual(['baz', 'bar']);
});

it('carries structural filtering provenance without a router and prunes dropped navigators', () => {
  const input = state();
  const original = result(input);
  const filtered = {
    ...input,
    routes: input.routes.filter((route) => route.name !== 'baz'),
    routeNames: ['bar', 'qux'],
    index: 1,
    history: input.history!.filter(() => true),
  };
  const inherited = recordHistoryResult(original.historyOrders!, input, filtered);
  expect(inherited.get(filtered.history)).toBe(original.historyOrders!.get(input.history!));
  const observed = observeHistoryOrders(inherited, filtered, new Map());
  expect(observed.size).toBe(1);
  expect(observed.has(input.history!)).toBe(false);
  expect(observeHistoryOrders(observed, { ...filtered, history: undefined }, new Map()).size).toBe(
    0
  );
});

it('leaves type-reset history absent through registration and initializes on navigation in current order', () => {
  const initial = result({ ...state(), type: 'drawer' });
  const changed = config(B);
  const reset = navigationTreeReducer(
    initial,
    { type: 'NAVIGATOR_CHANGED', stateKey: 'root', routerType: 'tab' },
    changed
  );
  expect(reset.state.history).toBeUndefined();
  const observed = navigationTreeReducer(reset, { type: 'ROUTERS_REGISTERED' }, changed);
  expect(observed.state).toBe(reset.state);
  const back = action(observed, { type: 'GO_BACK' }, changed);
  expect(back.state.routes[back.state.index]!.name).toBe('bar');
});

it('prepares parent history even when child navigation focuses the same parent key', () => {
  const child: NavigationState = {
    key: 'child',
    stale: false,
    routeKeySeq: 1,
    routeNames: ['index', 'details'],
    index: 0,
    routes: [{ key: 'index', name: 'index' }],
  };
  const input = {
    ...state(),
    routes: state().routes.map((route) =>
      route.name === 'qux' ? { ...route, state: child } : route
    ),
  };
  const stack = StackRouter({});
  const childEntry = {
    reduce: (state: NavigationState, action: NavigationAction) =>
      stack.getStateForAction(state as never, action as never, {
        routeNames: child.routeNames,
        routeGetIdList: {},
      }),
    shouldActionChangeFocus: stack.shouldActionChangeFocus,
  };
  const initial = result(input);
  const updated = {
    ...config(B),
    registry: new Map([
      ['root', entry(B)],
      ['child', childEntry],
    ]),
  };
  const next = action(
    initial,
    { type: 'PUSH', target: 'child', payload: { name: 'details' } },
    updated
  );
  expect(next.state.routes[next.state.index]!.key).toBe('qux');
  expect(keys(next.state)).toEqual(['baz', 'bar', 'qux']);
  expect(next.historyOrders!.get(next.state.history!)?.order).toEqual(B);
});

it.each(['history', 'fullHistory', 'none'] as const)(
  'preserves %s semantics through order-only preparation',
  (backBehavior) => {
    const current = config(A, { backBehavior });
    const initial = result(state(), current);
    const next = action(initial, { type: 'GO_BACK' }, config(B, { backBehavior }));
    expect(next.state.routes[next.state.index]!.name).toBe(backBehavior === 'none' ? 'qux' : 'bar');
  }
);

it('preserves drawer metadata during preparation and consumes close before route back', () => {
  const input = {
    ...state(),
    type: 'drawer',
    history: [...state().history!, { type: 'drawer', status: 'open' }],
  };
  const initial = result(input, config(A, undefined, true));
  const next = action(initial, { type: 'GO_BACK' }, config(B, undefined, true));
  expect(next.state.routes[next.state.index]!.name).toBe('qux');
  expect(keys(next.state)).toEqual(['baz', 'bar', 'qux']);
  expect(next.state.history).not.toContainEqual({ type: 'drawer', status: 'open' });
  expect(action(next, { type: 'GO_BACK' }, config(B, undefined, true)).state.index).toBe(0);
});

it('replays frozen registration and action inputs without changing earlier stamps', () => {
  const initial = deepFreeze(result());
  const entries = [...initial.historyOrders!];
  const current = deepFreeze(config(B));
  const registered = navigationTreeReducer(initial, { type: 'ROUTERS_REGISTERED' }, current);
  expect(navigationTreeReducer(initial, { type: 'ROUTERS_REGISTERED' }, current)).toEqual(
    registered
  );
  const next = action(registered, { type: 'GO_BACK' }, current);
  expect(action(registered, { type: 'GO_BACK' }, current)).toEqual(next);
  expect([...initial.historyOrders!]).toEqual(entries);
  expect(keys(initial.state)).toEqual(['bar', 'qux']);
  expect(JSON.stringify(next.state)).not.toMatch(/historyOrders|declaredRouteNames|baseline/);
});

it('preserves REPLACE truncation when changed declarations only move absent routes', () => {
  const input = { ...state(), routeNames: [...A, 'absent'] };
  const initial = result(input, config([...A, 'absent']));
  const next = action(initial, { type: 'GO_BACK' }, config(['absent', ...A]));
  expect(keys(next.state)).toEqual(['bar']);
});

it.each([false, true])(
  'uses mount-scoped options during membership repair (remount=%s)',
  (remount) => {
    const originalNode = node(
      '',
      A.map((name) => node(name))
    );
    const seed = createSeededRootState(undefined, originalNode);
    const child = seed.routes[0]!.state! as NavigationState;
    const mounted = entry(A, { backBehavior: 'firstRoute', initialRouteName: 'bar' });
    const originalConfig = {
      ...config(),
      routeNode: originalNode,
      registry: new Map([[child.key, mounted]]),
    };
    const original = result(seed, originalConfig);
    const navigated = action(
      original,
      { type: 'JUMP_TO', target: child.key, payload: { name: 'qux' } },
      originalConfig
    );
    const changedNode = {
      ...node(
        '',
        [...A, 'new'].map((name) => node(name))
      ),
      initialRouteName: 'baz',
    };
    const changedConfig = { ...originalConfig, routeNode: changedNode };
    const repaired = navigationTreeReducer(
      navigated,
      { type: 'ROUTE_CONFIG_CHANGED' },
      changedConfig
    );
    const routerEntry = remount
      ? entry(A, { backBehavior: 'initialRoute', initialRouteName: 'baz' })
      : mounted;
    const nextConfig = { ...changedConfig, registry: new Map([[child.key, routerEntry]]) };
    const registered = navigationTreeReducer(repaired, { type: 'ROUTERS_REGISTERED' }, nextConfig);
    const retained = registered.state.routes[0]!.state as NavigationState;
    const before = navigated.state.routes[0]!.state as NavigationState;
    expect(retained.routes[retained.index]!.key).toBe(before.routes[before.index]!.key);
    expect(retained.routeNames).toContain('new');
    const backed = action(registered, { type: 'GO_BACK', target: child.key }, nextConfig).state
      .routes[0]!.state as NavigationState;
    expect(backed.routes[backed.index]!.name).toBe(remount ? 'baz' : 'bar');
  }
);

it('establishes an eligible initial baseline when a mount action reduces with the first registered router', () => {
  const input = state();
  const initial = { ...result(input), historyOrders: initialHistoryOrders(input) };
  expect(keys(action(initial, { type: 'GO_BACK' }, config(A)).state)).toEqual(['bar']);
});

it('stamps histories lazily computed for a RESET payload with no supplied history', () => {
  const initial = result({ ...state(), history: undefined });
  const next = action(
    initial,
    { type: 'RESET', payload: { ...state(), history: undefined } },
    config(B)
  );
  expect(keys(next.state)).toEqual(['baz', 'bar', 'qux']);
  expect(next.historyOrders!.get(next.state.history!)?.order).toEqual(B);
});

it('does not publish parent history preparation for a targeted-null child action', () => {
  const child: NavigationState = {
    key: 'child',
    stale: false,
    routeKeySeq: 1,
    routeNames: ['index'],
    index: 0,
    routes: [{ key: 'index', name: 'index' }],
  };
  const input = {
    ...state(),
    routes: state().routes.map((route) =>
      route.name === 'qux' ? { ...route, state: child } : route
    ),
  };
  const initial = result(input);
  const current = {
    ...config(B),
    registry: new Map([
      ['root', entry(B)],
      ['child', { reduce: () => null, shouldActionChangeFocus: () => true }],
    ]),
  };
  const next = action(
    initial,
    { type: 'NAVIGATE', target: 'child', payload: { name: 'missing' } },
    current
  );
  expect(next.state).toBe(initial.state);
  expect(next.historyOrders).toBe(initial.historyOrders);
  expect(next.report).toBeUndefined();
});

it('freezes a runtime type reset without reporting it as HMR removal', () => {
  const routeNode = node(
    '',
    A.map((name) => node(name))
  );
  const seed = createSeededRootState(undefined, routeNode);
  const child = { ...state(), key: seed.routes[0]!.state!.key! };
  const input = { ...seed, routes: [{ ...seed.routes[0]!, state: child }] };
  const current = { ...config(), routeNode, registry: new Map() };
  const next = navigationTreeReducer(
    result(input, current),
    {
      type: 'NAVIGATOR_CHANGED',
      stateKey: child.key,
      routerType: 'stack',
    },
    current
  );
  const reset = next.state.routes[0]!.state!;
  expect(reset.routes.map((route) => route.name)).toEqual(['qux']);
  expect(Object.isFrozen(next.state)).toBe(true);
  expect(Object.isFrozen(reset)).toBe(true);
  expect(Object.isFrozen(reset.routes)).toBe(true);
  expect(next.report).toBeUndefined();
});
