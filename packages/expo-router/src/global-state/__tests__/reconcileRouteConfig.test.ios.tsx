import { deepFreeze } from '../../react-navigation/core/deepFreeze';
import { StackRouter, type NavigationState } from '../../react-navigation/routers';
import { createSeededRootState, createSeededNavigationState } from '../createSeededNavigationState';
import { reconcileRouteConfig } from '../reconcileRouteConfig';
import { node } from './__fixtures__/routeNode';

it('preserves an equivalent file tree and absent history by identity', () => {
  const root = node('', [node('index'), node('second')]);
  const state = deepFreeze(createSeededRootState(undefined, root));
  expect(
    reconcileRouteConfig(state, node('', [node('index'), node('second')]), new Map()).state
  ).toBe(state);
});

it('seeds new layouts and drops obsolete child states without replacing surviving keys', () => {
  const leaf = node('', [node('index')]);
  const state = deepFreeze(createSeededRootState(undefined, leaf));
  const nested = node('', [node('index', [node('child')])]);
  const changed = reconcileRouteConfig(state, nested, new Map());
  const route = changed.state.routes[0]!.state!.routes[0]!;
  expect(route.key).toBe(state.routes[0]!.state!.routes[0]!.key);
  expect(route.state).toMatchObject({ stale: false, routeNames: ['child'], index: 0 });
  expect(changed.pending.size).toBeGreaterThan(0);
  expect(reconcileRouteConfig(changed.state, nested, new Map(), changed.pending).state).toBe(
    changed.state
  );
  const restored = reconcileRouteConfig(changed.state, leaf, new Map(), changed.pending);
  expect(restored.state.routes[0]!.state!.routes[0]!.state).toBeUndefined();
  expect(restored.pending.has(route.state!.key!)).toBe(false);
});

it('repairs inactive and preloaded branches while preserving stack duplicates, params, and keys', () => {
  const archive = node('archive', [node('leaf')]);
  const pending = node('pending', [node('leaf')]);
  const root = node('', [node('index'), archive, pending]);
  const seeded = createSeededRootState(undefined, root);
  const layout = seeded.routes[0]!.state as NavigationState;
  const index = layout.routes[0]!;
  const archiveState = createSeededNavigationState(undefined, archive, 'archive');
  const pendingState = createSeededNavigationState(undefined, pending, 'pending');
  const active = { ...index, params: { id: '42' } };
  const duplicate = { ...index, key: 'index:20', params: { id: '43' } };
  const inactive = {
    name: 'archive',
    key: 'archive:21',
    isPreloaded: true as const,
    params: { saved: true },
    state: archiveState,
  };
  const preloaded = {
    name: 'pending',
    key: 'pending:22',
    isPreloaded: true as const,
    state: pendingState,
  };
  const state = deepFreeze({
    ...seeded,
    routes: [
      {
        ...seeded.routes[0]!,
        state: {
          ...layout,
          type: 'stack',
          index: 1,
          routeKeySeq: 23,
          routes: [active, duplicate, inactive, preloaded],
        },
      },
    ],
  });
  const changed = node('', [
    node('index'),
    node('archive', [node('leaf', [node('detail')])]),
    node('pending'),
  ]);
  const result = reconcileRouteConfig(state, changed, new Map());
  const repaired = result.state.routes[0]!.state as NavigationState;
  expect(repaired.routes.slice(0, 2)).toEqual([active, duplicate]);
  expect(repaired.routes[0]).toBe(active);
  expect(repaired.routes[1]).toBe(duplicate);
  expect(repaired.index).toBe(1);
  expect(repaired.routeKeySeq).toBe(23);
  expect(repaired.routes[2]).toMatchObject({
    key: inactive.key,
    isPreloaded: true as const,
    params: inactive.params,
  });
  expect(repaired.routes[2]!.state!.routes[0]!.key).toBe(archiveState.routes[0]!.key);
  expect(repaired.routes[2]!.state!.routes[0]!.state).toMatchObject({
    stale: false,
    index: 0,
    routeNames: ['detail'],
  });
  expect(repaired.routes[3]).toEqual({ name: 'pending', key: 'pending:22', isPreloaded: true });
  expect(reconcileRouteConfig(result.state, changed, new Map(), result.pending).state).toBe(
    result.state
  );
});

it('replaces deleted membership with the latest initial route without resetting the allocator', () => {
  const root = node('', [node('index'), node('old')]);
  const seeded = createSeededRootState(undefined, root);
  const layout = seeded.routes[0]!.state as NavigationState;
  const state = {
    ...seeded,
    routes: [{ ...seeded.routes[0]!, state: { ...layout, routeKeySeq: 12 } }],
  };
  const changed = node('', [node('first'), node('chosen', [node('detail')])], 'chosen');
  const result = reconcileRouteConfig(deepFreeze(state), changed, new Map());
  const repaired = result.state.routes[0]!.state as NavigationState;
  expect(repaired.routes[repaired.index]!.name).toBe('chosen');
  expect(repaired.routes[0]!.state).toMatchObject({ stale: false, routeNames: ['detail'] });
  expect(repaired.routeKeySeq).toBe(13);
});

it.each(['tab', 'drawer'])(
  'focuses an active survivor before adopting an unregistered %s',
  (type) => {
    const root = node('', [node('index'), node('old'), node('active')]);
    const seed = createSeededRootState(undefined, root);
    const layout = seed.routes[0]!.state as NavigationState;
    const state = {
      ...seed,
      routes: [
        {
          ...seed.routes[0]!,
          state: {
            ...layout,
            type,
            index: 1,
            routes: [
              { name: 'index', key: 'preload', isPreloaded: true as const },
              { name: 'old', key: 'old' },
              { name: 'active', key: 'active', params: { retained: true } },
            ],
          },
        },
      ],
    };
    const next = reconcileRouteConfig(
      deepFreeze(state),
      node('', [node('index'), node('active')]),
      new Map()
    ).state;
    const repaired = next.routes[0]!.state!;
    expect(repaired.routes[repaired.index!]).toBe(state.routes[0]!.state.routes[2]);
    expect(repaired.routes[0]!.isPreloaded).toBe(true);
  }
);

it('promotes only the fallback preload before adopting an unregistered stack', () => {
  const root = node('', [node('old'), node('first'), node('chosen'), node('last')]);
  const seed = createSeededRootState(undefined, root);
  const layout = seed.routes[0]!.state as NavigationState;
  const first = { name: 'first', key: 'first:1', isPreloaded: true as const };
  const chosen = {
    name: 'chosen',
    key: 'chosen:2',
    params: { retained: true },
    isPreloaded: true as const,
  };
  const last = { name: 'last', key: 'last:3', isPreloaded: true as const };
  const state = deepFreeze({
    ...seed,
    routes: [
      {
        ...seed.routes[0]!,
        state: {
          ...layout,
          type: 'stack',
          index: 0,
          routeKeySeq: 4,
          routes: [{ name: 'old', key: 'old:0' }, first, chosen, last],
        },
      },
    ],
  });
  const changed = node('', [node('first'), node('chosen'), node('last')], 'chosen');
  const result = reconcileRouteConfig(state, changed, new Map());
  const repaired = result.state.routes[0]!.state as NavigationState;
  const router = StackRouter({ initialRouteName: 'chosen' });
  const adopted = router.getStateForRouteConfigChange(
    { ...repaired, type: 'stack' },
    {
      routeNames: repaired.routeNames,
      declaredRouteNames: repaired.routeNames,
      repairHistory: true,
    }
  );

  expect(
    router.getStateForAction(
      adopted,
      { type: 'GO_BACK' },
      {
        routeNames: repaired.routeNames,
        routeGetIdList: {},
      }
    )
  ).toBeNull();
  expect(repaired.index).toBe(0);
  expect(repaired.routes).toEqual([
    { name: chosen.name, key: chosen.key, params: chosen.params },
    first,
    last,
  ]);
  expect(repaired.routes[1]).toBe(first);
  expect(repaired.routes[2]).toBe(last);
  expect(repaired.routeKeySeq).toBe(4);
  expect(adopted.routes).toBe(repaired.routes);
  expect(reconcileRouteConfig(result.state, changed, new Map(), result.pending).state).toBe(
    result.state
  );
});

it.each(['tab', 'drawer'])(
  'repairs unregistered %s focus without dropping repeated visits or non-route history',
  (type) => {
    const root = node('', [node('a'), node('b'), node('c')]);
    const seed = createSeededRootState(undefined, root);
    const child = seed.routes[0]!.state as NavigationState;
    const nonRoute = { type: 'drawer', status: 'open' };
    const history = [
      ...['a', 'b', 'a', 'b', 'c'].map((key) => ({ type: 'route', key, params: { visit: 'old' } })),
      nonRoute,
    ];
    const state = deepFreeze({
      ...seed,
      routes: [
        {
          ...seed.routes[0]!,
          state: {
            ...child,
            type,
            index: 2,
            routes: ['a', 'b', 'c'].map((name) => ({
              key: name,
              name,
              params: { visit: 'current' },
            })),
            history,
          },
        },
      ],
    });
    const routeNode = node('', [node('a'), node('b')]);
    const repaired = reconcileRouteConfig(state, routeNode, new Map());
    const next = repaired.state.routes[0]!.state as NavigationState;
    expect(next.routes[next.index]!.name).toBe('a');
    expect(next.history).toEqual([
      ...history.slice(0, 4),
      { type: 'route', key: 'a', params: { visit: 'current' } },
      nonRoute,
    ]);
    expect(next.history![next.history!.length - 1]).toBe(nonRoute);
    expect(reconcileRouteConfig(repaired.state, routeNode, new Map(), repaired.pending).state).toBe(
      repaired.state
    );
    expect(history).toHaveLength(6);
  }
);
