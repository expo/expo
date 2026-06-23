import { expect, test } from '@jest/globals';

import { getNextRouteKeyFromState, getRouteKey } from '../getRouteKey';

test('derives a key from pathname and name at index 0', () => {
  expect(getRouteKey('/(tabs)', 'home', 0)).toBe('/(tabs)-home');
});

test('appends the index only when greater than 0', () => {
  expect(getRouteKey('/(tabs)', 'details', 1)).toBe('/(tabs)-details-1');
  expect(getRouteKey('/(tabs)', 'details', 2)).toBe('/(tabs)-details-2');
});

test('defaults the index to 0', () => {
  expect(getRouteKey('/(tabs)', 'home')).toBe('/(tabs)-home');
});

test('omits the pathname (never emits the literal "undefined") when it is absent', () => {
  expect(getRouteKey(undefined, 'home', 0)).toBe('home');
  expect(getRouteKey(undefined, 'home', 3)).toBe('home-3');
  expect(getRouteKey('', 'home', 0)).toBe('home');
});

test('getNextRouteKeyFromState returns index 0 when no route uses the name', () => {
  expect(
    getNextRouteKeyFromState('/(tabs)', 'details', { routes: [{ key: '/(tabs)-home', name: 'home' }] })
  ).toBe('/(tabs)-details');
});

test('getNextRouteKeyFromState uses the same-name count as the next index', () => {
  const state = {
    routes: [
      { key: '/(s)-details', name: 'details' },
      { key: '/(s)-details-1', name: 'details' },
    ],
  };
  expect(getNextRouteKeyFromState('/(s)', 'details', state)).toBe('/(s)-details-2');
});

test('getNextRouteKeyFromState bumps past a collision at the count-based index', () => {
  // One `details` route, so the base index is 1 — but `-1` is already taken, so it bumps to `-2`.
  const state = { routes: [{ key: '/(s)-details-1', name: 'details' }] };
  expect(getNextRouteKeyFromState('/(s)', 'details', state)).toBe('/(s)-details-2');
});
