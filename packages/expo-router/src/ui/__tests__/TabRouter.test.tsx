import { expect, test } from '@jest/globals';

import type { ParamListBase, TabNavigationState } from '../../react-navigation/native';
import { ExpoTabRouter } from '../TabRouter';
import type { TriggerMap } from '../common';

function buildTabState(
  routes: TabNavigationState<ParamListBase>['routes'],
  index: number
): TabNavigationState<ParamListBase> {
  return {
    stale: false,
    type: 'tab',
    key: 'tabs',
    index,
    routeNames: routes.map((route) => route.name),
    routes,
    history: [{ type: 'route', key: routes[0]!.key }],
  };
}

test('reselecting a seeded tab returns tab metadata', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first'], routeGetIdList: {} };
  const result = router.getStateForAction(
    {
      stale: false,
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

  expect(result?.state).toMatchObject({ type: 'tab', history: expect.any(Array) });
});

test('reports the key selected when preserving nested tab state', () => {
  const triggerMap: TriggerMap = {};
  const router = ExpoTabRouter({ triggerMap });
  const options = { routeNames: ['first', 'second'], routeGetIdList: {} };
  const state = buildTabState(
    [
      { key: 'first-key', name: 'first' },
      {
        key: 'second-key',
        name: 'second',
        state: { routes: [{ name: 'child' }] },
      },
    ],
    0
  );

  const result = router.getStateForAction(
    state,
    { type: 'JUMP_TO', payload: { name: 'second' } },
    options
  );

  expect(result?.affectedRouteKey).toBe('second-key');
  expect(result?.state.index).toBe(1);
});

test('reselecting a tab with matching carried state preserves its history', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first', 'second'], routeGetIdList: {} };
  const childState = {
    routes: [{ name: 'child' }, { name: 'details' }],
    index: 1,
    __internal__routerActionState: true as const,
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
      payload: { name: 'second', state: { ...childState } },
    },
    options
  );

  expect(result?.state).toBe(state);
  expect(result?.state.routes[1]?.state).toBe(childState);
});

test('replaces a tab child state when trusted carried state differs', () => {
  const router = ExpoTabRouter({ triggerMap: {} });
  const options = { routeNames: ['first', 'second'], routeGetIdList: {} };
  const nextChildState = {
    routes: [{ name: 'replacement' }],
    __internal__routerActionState: true as const,
  };
  const state = buildTabState(
    [
      { key: 'first-key', name: 'first' },
      { key: 'second-key', name: 'second', state: { routes: [{ name: 'child' }] } },
    ],
    0
  );

  const result = router.getStateForAction(
    state,
    {
      type: 'JUMP_TO',
      payload: { name: 'second', state: nextChildState },
    },
    options
  );

  expect(result?.state.routes[1]?.state).toBe(nextChildState);
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
