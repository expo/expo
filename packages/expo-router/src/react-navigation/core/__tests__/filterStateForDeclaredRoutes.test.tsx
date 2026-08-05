import { expect, test } from '@jest/globals';

import type { NavigationState } from '../../routers';
import { filterStateForDeclaredRoutes } from '../filterStateForDeclaredRoutes';

const state: NavigationState = {
  stale: false,
  type: 'tab',
  key: 'test',
  index: 2,
  routeNames: ['first', 'removed', 'focused', 'last'],
  routes: [
    { key: 'first', name: 'first' },
    { key: 'removed', name: 'removed' },
    { key: 'focused', name: 'focused' },
    { key: 'last', name: 'last' },
  ],
  history: [{ type: 'route', key: 'removed' }],
};

test('returns the same state when every route is declared', () => {
  expect(filterStateForDeclaredRoutes(state, state.routeNames)).toBe(state);
});

test('returns an empty state when no route is declared', () => {
  expect(filterStateForDeclaredRoutes(state, ['replacement'])).toEqual({
    ...state,
    index: -1,
    routes: [],
  });
});

test('filters routes without reordering or changing unrelated state', () => {
  const result = filterStateForDeclaredRoutes(state, ['last', 'focused', 'first']);

  expect(result).toEqual({
    ...state,
    index: 1,
    routes: [state.routes[0], state.routes[2], state.routes[3]],
  });
  expect(result.history).toBe(state.history);
  expect(result.routeNames).toBe(state.routeNames);
});

test('falls back to the first survivor when the focused route is removed', () => {
  const result = filterStateForDeclaredRoutes(state, ['first', 'removed', 'last']);

  expect(result.index).toBe(0);
  expect(result.routes[result.index]).toBe(state.routes[0]);
});

test('falls back to the first survivor when no earlier route survives', () => {
  const result = filterStateForDeclaredRoutes({ ...state, index: 0 }, ['focused', 'last']);

  expect(result.index).toBe(0);
  expect(result.routes[result.index]).toBe(state.routes[2]);
});
