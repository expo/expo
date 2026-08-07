import { ensureStateKeys } from '../ensureStateKeys';
import type { NavigationState } from '../types';

jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => 'test') }));

test('adds navigator and route keys recursively', () => {
  const result = ensureStateKeys(
    {
      routes: [
        {
          name: 'parent',
          state: { type: 'tab', routes: [{ name: 'child' }] },
        },
      ],
    },
    'stack'
  );

  expect(result).toEqual({
    key: 'stack-test',
    routes: [
      {
        key: 'parent-test',
        name: 'parent',
        state: {
          key: 'tab-test',
          type: 'tab',
          routes: [{ key: 'child-test', name: 'child' }],
        },
      },
    ],
  });
});

test('preserves existing keys and object identity when every level is keyed', () => {
  const state = {
    key: 'root',
    routes: [
      {
        key: 'parent',
        name: 'parent',
        state: { key: 'nested', routes: [{ key: 'child', name: 'child' }] },
      },
    ],
  };

  expect(ensureStateKeys(state, 'stack')).toBe(state);
});

test('only replaces ancestors of a changed nested state', () => {
  const unchangedRoute = { key: 'first', name: 'first' };
  const state = {
    key: 'root',
    routes: [
      unchangedRoute,
      { key: 'parent', name: 'parent', state: { routes: [{ key: 'child', name: 'child' }] } },
    ],
  };

  const result = ensureStateKeys(state, 'stack');

  expect(result).not.toBe(state);
  expect(result.routes[0]).toBe(unchangedRoute);
  expect(result.routes[1]!.state!.key).toBe('navigation-test');
});

test('returns a fresh navigation state unchanged', () => {
  const state: NavigationState = {
    stale: false,
    type: 'test',
    key: 'root',
    index: 0,
    routeNames: ['index'],
    routes: [{ key: 'index', name: 'index' }],
  };

  expect(ensureStateKeys(state)).toBe(state);
});
