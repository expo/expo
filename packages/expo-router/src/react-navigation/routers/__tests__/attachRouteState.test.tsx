import { expect, jest, test } from '@jest/globals';

import { attachRouteState } from '../attachRouteState';

const childState = {
  __internal__routerActionState: true as const,
  stale: false as const,
  key: 'child',
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index', name: 'index' }],
};

test('attaches trusted state without mutating the route', () => {
  const route = { key: 'target', name: 'target' };

  const result = attachRouteState(route, {
    payload: { state: childState },
  });

  expect(result).toEqual({ ...route, state: childState });
  expect(result).not.toBe(route);
  expect(route).toEqual({ key: 'target', name: 'target' });
});

test('returns the route unchanged when it already carries matching state', () => {
  const route = { key: 'target', name: 'target', state: childState };

  expect(
    attachRouteState(route, {
      payload: { state: { ...childState } },
    })
  ).toBe(route);
});

test('ignores markers throughout matching nested state', () => {
  const nestedState = {
    ...childState,
    routes: [
      {
        key: 'index',
        name: 'index',
        state: { ...childState, key: 'nested', __internal__routerActionState: true as const },
      },
    ],
  };
  const route = {
    key: 'target',
    name: 'target',
    state: {
      ...nestedState,
      __internal__routerActionState: undefined,
      routes: nestedState.routes.map((nestedRoute) => ({
        ...nestedRoute,
        state: { ...nestedRoute.state, __internal__routerActionState: undefined },
      })),
    },
  };

  expect(attachRouteState(route, { payload: { state: nestedState } })).toBe(route);
});

test('ignores untrusted state and warns', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const route = { key: 'target', name: 'target' };
  const { __internal__routerActionState, ...untrustedState } = childState;

  expect(attachRouteState(route, { payload: { state: untrustedState } })).toBe(route);
  expect(warning).toHaveBeenCalledTimes(1);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining('__internal__routerActionState'));

  warning.mockRestore();
});

test('warns for untrusted state even when the route already carries it', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { __internal__routerActionState, ...untrustedState } = childState;
  const route = { key: 'target', name: 'target', state: untrustedState };

  expect(attachRouteState(route, { payload: { state: untrustedState } })).toBe(route);
  expect(warning).toHaveBeenCalledTimes(1);

  warning.mockRestore();
});
