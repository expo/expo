import { expect, test } from '@jest/globals';

import type { NavigationState } from '../../react-navigation/native';
import { appendMissingPlaceholderTabRoutes } from '../appendMissingPlaceholderTabRoutes';
import type { PlaceholderDescriptorMap } from '../types';

const descriptors = {
  one: { route: { name: 'one' } },
  two: { route: { name: 'two' } },
  three: { route: { name: 'three' } },
} as unknown as PlaceholderDescriptorMap;

const state: NavigationState = {
  stale: false,
  key: 'tabs',
  routeKeySeq: 0,
  routeNames: ['one', 'two', 'three'],
  routes: [
    { name: 'three', key: 'three-key' },
    { name: 'one', key: 'one-key' },
  ],
  index: 0,
};

test('always projects routes in declared order and preserves focus', () => {
  const next = appendMissingPlaceholderTabRoutes(state, descriptors, undefined, [
    'one',
    'two',
    'three',
  ]);
  expect(next.routes.map((route) => route.name)).toEqual(['one', 'two', 'three']);
  expect(next.routes[next.index]?.key).toBe('three-key');
  expect(next.routes[0]).toBe(state.routes[1]);
});

test('uses builder route names instead of stale state route names', () => {
  const next = appendMissingPlaceholderTabRoutes(
    { ...state, routes: [...state.routes, { name: 'two', key: 'two-key' }] },
    descriptors,
    undefined,
    ['three', 'two', 'one']
  );
  expect(next.routes.map((route) => route.name)).toEqual(['three', 'two', 'one']);
  expect(next.index).toBe(0);
});

test('keeps empty routes at index -1', () => {
  const next = appendMissingPlaceholderTabRoutes(
    { ...state, routeNames: [], routes: [], index: -1 },
    {},
    undefined,
    []
  );
  expect(next.routes).toEqual([]);
  expect(next.index).toBe(-1);
});
