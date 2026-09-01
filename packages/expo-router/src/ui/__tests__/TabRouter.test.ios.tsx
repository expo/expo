import { expect, test } from '@jest/globals';

import type { ParamListBase, TabNavigationState } from '../../react-navigation/native';
import { ExpoTabRouter } from '../TabRouter';

function buildTabState(
  routes: TabNavigationState<ParamListBase>['routes'],
  index: number
): TabNavigationState<ParamListBase> {
  return {
    stale: false,
    routeKeySeq: 0,
    type: 'tab',
    key: 'tabs',
    index,
    routeNames: routes.map((route) => route.name),
    routes,
  };
}

test('reselecting a seeded tab returns tab metadata', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first'], routeGetIdList: {} };
  const result = router.getStateForAction(
    {
      stale: false,
      routeKeySeq: 0,
      key: 'tabs',
      index: 0,
      routeNames: options.routeNames,
      routes: [
        {
          key: 'first-key',
          name: 'first',
          state: { routes: [{ name: 'child' }] },
        },
      ],
    },
    { type: 'JUMP_TO', payload: { name: 'first' } },
    options
  );

  expect(result).toStrictEqual({
    affectedRouteKey: 'first-key',
    state: {
      stale: false,
      routeKeySeq: 0,
      type: 'tab',
      key: 'tabs',
      index: 0,
      routeNames: ['first'],
      routes: [
        {
          key: 'first-key',
          name: 'first',
          state: { routes: [{ name: 'child' }] },
        },
      ],
    },
  });
});

test('reselecting a tab with matching carried state preserves the state', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first', 'second'], routeGetIdList: {} };
  const childState = {
    routes: [{ name: 'child' }, { name: 'details' }],
    index: 1,
  };
  const state = buildTabState(
    [
      { key: 'first-key', name: 'first' },
      { key: 'second-key', name: 'second', state: childState },
    ],
    1
  );

  const result = router.getStateForAction(
    state,
    {
      type: 'JUMP_TO',
      payload: {
        name: 'second',
        state: { ...childState, __internal__routerActionState: true as const },
      },
    },
    options
  );

  expect(result?.state).toBe(state);
  expect(result?.state.routes[1]?.state).toBe(childState);
});

test('resetOnFocus preserves child state when reselecting the focused tab', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first', 'second'], routeGetIdList: {} };
  const childState = { routes: [{ name: 'child' }, { name: 'details' }], index: 1 };
  const state = buildTabState(
    [
      { key: 'first-key', name: 'first' },
      { key: 'second-key', name: 'second', state: childState },
    ],
    1
  );

  const result = router.getStateForAction(
    state,
    { type: 'JUMP_TO', payload: { name: 'second', resetOnFocus: true } },
    options
  );

  expect(result?.state.routes[1]?.state).toBe(childState);
});

test('resetOnFocus clears child state when switching tabs', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first', 'second'], routeGetIdList: {} };
  const firstChildState = { routes: [{ name: 'first-child' }] };
  const state = buildTabState(
    [
      { key: 'first-key', name: 'first', state: firstChildState },
      { key: 'second-key', name: 'second', state: { routes: [{ name: 'second-child' }] } },
    ],
    0
  );

  const result = router.getStateForAction(
    state,
    { type: 'JUMP_TO', payload: { name: 'second', resetOnFocus: true } },
    options
  );

  expect(result?.state.index).toBe(1);
  expect(result?.state.routes[0]?.state).toBe(firstChildState);
  expect(result?.state.routes[1]?.state).toBeUndefined();
});
