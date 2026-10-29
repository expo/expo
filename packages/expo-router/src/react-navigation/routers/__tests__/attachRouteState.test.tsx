import { expect, jest, test } from '@jest/globals';

import { attachRouteState } from '../attachRouteState';

const childState = {
  __internal__routerActionState: true as const,
  stale: false as const,
  routeKeySeq: 0,
  key: 'child',
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index', name: 'index' }],
};

test('attaches trusted state without mutating the route', () => {
  const route = { key: 'target', name: 'target' };
  const { __internal__routerActionState, ...unmarkedState } = childState;

  const result = attachRouteState(route, {
    payload: { state: childState },
  });

  expect(result).toEqual({ ...route, state: unmarkedState });
  expect(result).not.toBe(route);
  expect(route).toEqual({ key: 'target', name: 'target' });
  expect(JSON.stringify(result)).not.toContain('__internal__routerActionState');
  expect(childState).toHaveProperty('__internal__routerActionState', true);
});

test('strips markers from nested attached state', () => {
  const state = {
    ...childState,
    routes: [
      {
        key: 'index',
        name: 'index',
        state: { ...childState, key: 'nested' },
      },
    ],
  };

  const result = attachRouteState({ key: 'target', name: 'target' }, { payload: { state } });

  expect(JSON.stringify(result)).not.toContain('__internal__routerActionState');
  expect(JSON.stringify(state)).toContain('__internal__routerActionState');
});

test('does not replace existing unmarked state when only the marker differs', () => {
  const { __internal__routerActionState, ...unmarkedState } = childState;
  const route = { key: 'target', name: 'target', state: unmarkedState };

  expect(attachRouteState(route, { payload: { state: childState } })).toBe(route);
});

test('returns the route unchanged for null state', () => {
  const route = { key: 'target', name: 'target' };

  expect(attachRouteState(route, { payload: { state: null } })).toBe(route);
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
  const { __internal__routerActionState, ...unmarkedNestedState } = nestedState;
  const route = {
    key: 'target',
    name: 'target',
    state: {
      ...unmarkedNestedState,
      routes: nestedState.routes.map((nestedRoute) => ({
        ...nestedRoute,
        state: (({ __internal__routerActionState, ...state }) => state)(nestedRoute.state),
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
