import type { NavigationState } from '../../react-navigation/routers';
import { reconcileRoutes } from '../reconcileRoutes';
import { getRootStackRouteNames } from '../utils';
import { node } from './__fixtures__/routeNode';

function state(
  routeNames: string[],
  routes: NavigationState['routes'],
  options: Partial<NavigationState> = {}
): NavigationState {
  return {
    stale: false,
    routeKeySeq: 0,
    key: 'navigator:0',
    index: routes.length - 1,
    routeNames,
    routes,
    ...options,
  };
}

function rootState(appState: NavigationState): NavigationState {
  return state(getRootStackRouteNames(), [{ key: '__root:0', name: '__root', state: appState }], {
    key: 'navigator:root',
    index: 0,
  });
}

function getAppState(root: NavigationState): NavigationState {
  const appState = root.routes[0]?.state;
  if (appState?.stale !== false) {
    throw new Error('Expected a complete app state.');
  }
  return appState;
}

test('drops removed routes and rewrites route names in declared order', () => {
  const first = { key: 'first:0-0', name: 'first' };
  const current = rootState(
    state(['second', 'first'], [{ key: 'second:0-1', name: 'second' }, first])
  );

  const next = reconcileRoutes(current, node('root', [node('first')]));
  const appState = getAppState(next);

  expect(appState.routeNames).toEqual(['first']);
  expect(appState.routes).toEqual([first]);
  expect(appState.routes[0]).toBe(first);
  expect(appState.index).toBe(0);
});

test('re-seeds an emptied level with its initial route', () => {
  const current = rootState(state(['removed'], [{ key: 'removed:0-0', name: 'removed' }]));

  const next = reconcileRoutes(current, node('root', [node('first'), node('second')], 'second'));
  const appState = getAppState(next);

  expect(appState.routeNames).toEqual(['second', 'first']);
  expect(appState.routes).toEqual([expect.objectContaining({ name: 'second' })]);
  expect(appState.index).toBe(0);
  expect(appState.routeKeySeq).toBe(1);
});

test('clamps focus to the first survivor when a focused tab route is removed', () => {
  const current = rootState(
    state(
      ['first', 'second', 'third'],
      [
        { key: 'first:0-0', name: 'first' },
        { key: 'second:0-1', name: 'second' },
        { key: 'third:0-2', name: 'third' },
      ],
      { type: 'tab', index: 2 }
    )
  );

  const next = reconcileRoutes(current, node('root', [node('first'), node('second')]));
  const appState = getAppState(next);

  expect(appState.index).toBe(0);
  expect(appState.routes[appState.index]?.name).toBe('first');
});

test('sets index to -1 when a level has no routes', () => {
  const current = rootState(state(['first'], [{ key: 'first:0-0', name: 'first' }]));

  const next = reconcileRoutes(current, node('root'));
  const appState = getAppState(next);

  expect(appState.routeNames).toEqual([]);
  expect(appState.routes).toEqual([]);
  expect(appState.index).toBe(-1);
});

test('keeps the top surviving active stack route and filters preloaded routes separately', () => {
  const current = rootState(
    state(
      ['first', 'removed', 'top', 'preloaded', 'removed-preload'],
      [
        { key: 'first:0-0', name: 'first' },
        { key: 'removed:0-1', name: 'removed' },
        { key: 'top:0-2', name: 'top' },
        { key: 'preloaded:0-3', name: 'preloaded' },
        { key: 'removed-preload:0-4', name: 'removed-preload' },
      ],
      { type: 'stack', index: 2 }
    )
  );

  const next = reconcileRoutes(
    current,
    node('root', [node('first'), node('top'), node('preloaded')])
  );
  const appState = getAppState(next);

  expect(appState.routes.map(({ name }) => name)).toEqual(['first', 'top', 'preloaded']);
  expect(appState.index).toBe(1);
  expect(appState.routes[appState.index]?.name).toBe('top');
});

test('promotes a surviving preloaded route when every active stack route was removed', () => {
  const preloaded = { key: 'preloaded:0-1', name: 'preloaded' };
  const current = rootState(
    state(['active', 'preloaded'], [{ key: 'active:0-0', name: 'active' }, preloaded], {
      type: 'stack',
      index: 0,
    })
  );

  const next = reconcileRoutes(current, node('root', [node('preloaded')], 'preloaded'));
  const appState = getAppState(next);

  expect(appState.routes).toEqual([preloaded]);
  expect(appState.routes[0]).toBe(preloaded);
  expect(appState.index).toBe(0);
  expect(appState.routeKeySeq).toBe(0);
});

test.each(['tab', 'drawer'] as const)(
  'repairs full history and preserves navigator metadata for %s state',
  (type) => {
    const current = rootState(
      state(
        ['first', 'second', 'removed'],
        [
          { key: 'first:0-0', name: 'first', params: { answer: 42 } },
          { key: 'second:0-1', name: 'second' },
          { key: 'removed:0-2', name: 'removed' },
        ],
        {
          type,
          index: 2,
          history: [
            { type: 'route', key: 'first:0-0', params: { old: true } },
            { type: 'route', key: 'second:0-1' },
            { type: 'route', key: 'removed:0-2' },
          ],
          ...(type === 'drawer' ? { drawerStatus: 'open' } : undefined),
        }
      )
    );

    const next = reconcileRoutes(current, node('root', [node('first'), node('second')]));
    const appState = getAppState(next);

    expect(appState.history).toEqual([
      { type: 'route', key: 'first:0-0', params: { old: true } },
      { type: 'route', key: 'second:0-1' },
      { type: 'route', key: 'first:0-0', params: { answer: 42 } },
    ]);
    if (type === 'drawer') {
      expect(appState).toMatchObject({ drawerStatus: 'open' });
    }
  }
);

test('prunes an unmounted nested level from route node children', () => {
  const nestedState = state(
    ['index', 'old'],
    [
      { key: 'index:0-0-0', name: 'index' },
      { key: 'old:0-0-1', name: 'old' },
    ],
    { key: 'navigator:0-0', type: 'stack', index: 1 }
  );
  const account = { key: 'account:0-0', name: 'account', state: nestedState };
  const current = rootState(state(['account'], [account]));

  const next = reconcileRoutes(
    current,
    node('root', [node('account', [node('index'), node('new')])])
  );
  const accountState = getAppState(next).routes[0]?.state;

  expect(accountState).toMatchObject({
    routeNames: ['index', 'new'],
    routes: [{ key: 'index:0-0-0', name: 'index' }],
    index: 0,
  });
});

test('seeds state when a retained route gains children', () => {
  const current = rootState(state(['second'], [{ key: 'second:0-0', name: 'second' }]));

  const next = reconcileRoutes(current, node('root', [node('second', [node('index')])]));

  expect(getAppState(next).routes[0]?.state).toMatchObject({
    stale: false,
    routeNames: ['index'],
    routes: [expect.objectContaining({ name: 'index' })],
    index: 0,
  });
});

test('drops state when a retained route loses its children', () => {
  const nestedState = state(['index'], [{ key: 'index:0-0-0', name: 'index' }], {
    key: 'navigator:0-0',
    type: 'stack',
  });
  const current = rootState(
    state(['account'], [{ key: 'account:0-0', name: 'account', state: nestedState }])
  );

  const next = reconcileRoutes(current, node('root', [node('account')]));

  expect(getAppState(next).routes[0]).toEqual({ key: 'account:0-0', name: 'account' });
});

test('returns the same state for an unchanged route tree', () => {
  const nestedState = state(['index'], [{ key: 'index:0-0-0', name: 'index' }], {
    key: 'navigator:0-0',
    type: 'stack',
  });
  const current = rootState(
    state(['account'], [{ key: 'account:0-0', name: 'account', state: nestedState }])
  );

  expect(reconcileRoutes(current, node('root', [node('account', [node('index')])]))).toBe(current);
});
