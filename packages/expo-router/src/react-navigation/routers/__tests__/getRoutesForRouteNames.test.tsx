import { expect, jest, test } from '@jest/globals';

import { getRoutesForRouteNames, type StackNavigationState, type ParamListBase } from '..';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

function stackState(
  routes: { name: string; key: string }[],
  index: number
): StackNavigationState<ParamListBase> {
  return {
    key: 'stack-test',
    index,
    routeNames: routes.map((r) => r.name),
    routes,
    type: 'stack',
    stale: false,
  } as StackNavigationState<ParamListBase>;
}

test('keeps routes whose name is allowed, preserving order', () => {
  const state = stackState(
    [
      { name: 'a', key: 'a-1' },
      { name: 'secret', key: 'secret-1' },
      { name: 'b', key: 'b-1' },
    ],
    2
  );

  expect(getRoutesForRouteNames(state, ['a', 'b'], { routeParamList: {} })).toEqual({
    routes: [
      { name: 'a', key: 'a-1' },
      { name: 'b', key: 'b-1' },
    ],
    index: 1,
  });
});

test('clamps the index to the last remaining route', () => {
  const state = stackState(
    [
      { name: 'a', key: 'a-1' },
      { name: 'secret', key: 'secret-1' },
    ],
    1
  );

  // Focused route (index 1) is dropped, so index clamps to the last remaining route.
  expect(getRoutesForRouteNames(state, ['a'], { routeParamList: {} })).toEqual({
    routes: [{ name: 'a', key: 'a-1' }],
    index: 0,
  });
});

test('excludes routes whose name changed key', () => {
  const state = stackState(
    [
      { name: 'a', key: 'a-1' },
      { name: 'b', key: 'b-1' },
    ],
    1
  );

  expect(
    getRoutesForRouteNames(state, ['a', 'b'], { routeParamList: {}, routeKeyChanges: ['b'] })
  ).toEqual({
    routes: [{ name: 'a', key: 'a-1' }],
    index: 0,
  });
});

test('falls back to the initial route when nothing remains', () => {
  const state = stackState([{ name: 'secret', key: 'secret-1' }], 0);

  expect(
    getRoutesForRouteNames(state, ['a', 'b'], {
      routeParamList: { a: { from: 'params' } },
      initialRouteName: 'a',
    })
  ).toEqual({
    routes: [{ name: 'a', key: 'a-test', params: { from: 'params' } }],
    index: 0,
  });
});

test('falls back to the first route name when there is no initial route', () => {
  const state = stackState([{ name: 'secret', key: 'secret-1' }], 0);

  expect(getRoutesForRouteNames(state, ['b', 'c'], { routeParamList: {} })).toEqual({
    routes: [{ name: 'b', key: 'b-test', params: undefined }],
    index: 0,
  });
});
