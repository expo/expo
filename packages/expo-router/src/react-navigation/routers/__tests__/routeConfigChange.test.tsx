import { deepFreeze } from '../../core/deepFreeze';
import { DrawerRouter, StackRouter, TabRouter } from '../index';

const state = {
  stale: false as const,
  key: 'navigator:root',
  routeKeySeq: 2,
  routeNames: ['index', 'second'],
  index: 1,
  routes: [
    { key: 'index:0', name: 'index' },
    { key: 'second:1', name: 'second' },
  ],
};

it.each([StackRouter, TabRouter, DrawerRouter])(
  'preserves valid seeded state without initializing history',
  (factory) => {
    const router = factory({});
    const input = deepFreeze(state);
    expect(
      router.getStateForRouteConfigChange(input, {
        routeNames: state.routeNames,
        declaredRouteNames: ['second', 'index'],
      })
    ).toBe(input);
  }
);

it('repairs membership while retaining canonical order and the focused survivor', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const input = deepFreeze({
    ...state,
    history: [
      { type: 'route' as const, key: 'index:0' },
      { type: 'route' as const, key: 'second:1' },
    ],
  });
  const result = router.getStateForRouteConfigChange(input, {
    routeNames: ['second', 'third'],
    declaredRouteNames: ['third', 'second'],
  });
  expect(result.routeNames).toEqual(['second', 'third']);
  expect(result.routes[result.index]).toBe(state.routes[1]);
  expect(result.history).toEqual([{ type: 'route', key: 'second:1' }]);
  expect(
    router.getStateForRouteConfigChange(result, {
      routeNames: ['second', 'third'],
      declaredRouteNames: ['third', 'second'],
    })
  ).toBe(result);
});

it('prepares stale history in declared order without rewriting canonical membership', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const input = deepFreeze({
    ...state,
    type: 'tab' as const,
    history: [
      { type: 'route' as const, key: 'index:0' },
      { type: 'route' as const, key: 'second:1' },
    ],
  });
  expect(
    router.getStateForAction(
      router.getStateForRouteConfigChange(input, {
        routeNames: input.routeNames,
        declaredRouteNames: ['second', 'index'],
        repairHistory: true,
        orderOnly: true,
      }),
      { type: 'GO_BACK' },
      {
        routeNames: ['second', 'index'],
        routeGetIdList: {},
      }
    )
  ).toBeNull();
});

it.each([TabRouter, DrawerRouter])(
  'uses declared first route when Back must add a missing route',
  (factory) => {
    const router = factory({ backBehavior: 'firstRoute' });
    const input = {
      ...state,
      index: 0,
      routeNames: ['index', 'second', 'third'],
      routes: [{ key: 'third:0', name: 'third' }],
      history: undefined,
    };
    const result = router.getStateForAction(
      input,
      { type: 'GO_BACK' },
      { routeNames: ['second', 'index', 'third'], routeGetIdList: {} }
    );
    expect(result?.state.routes[result.state.index]?.name).toBe('second');
    expect(result?.state.routeNames).toBe(input.routeNames);
    expect(result?.state.routes[0]).toBe(input.routes[0]);
  }
);

it('reconstructs PRELOAD history in declared order without changing focus', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const input = { ...state, routeNames: ['index', 'second', 'third'] };
  const result = router.getStateForAction(
    input,
    { type: 'PRELOAD', payload: { name: 'third' } },
    { routeNames: ['third', 'index', 'second'], routeGetIdList: {} }
  );
  expect(result?.state.routes[result.state.index]?.key).toBe('second:1');
  expect(result?.state.history?.map((item) => item.key)).toEqual([
    result?.affectedRouteKey,
    'index:0',
    'second:1',
  ]);
  expect(result?.state.routeNames).toBe(input.routeNames);
});
