import { expect, jest, test } from '@jest/globals';

import { createInitialState } from '../createInitialState';

jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => 'test') }));

const routeNames = ['first', 'second'];

test('creates sparse state focused on the first route by default', () => {
  expect(createInitialState({ routeNames })).toEqual({
    stale: false,
    key: 'navigator-test',
    index: 0,
    routeNames,
    routes: [{ key: 'first-test', name: 'first' }],
  });
});

test('focuses a valid configured initial route', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'second',
    })
  ).toEqual({
    stale: false,
    key: 'navigator-test',
    index: 0,
    routeNames,
    routes: [{ key: 'second-test', name: 'second' }],
  });
});

test('falls back to the first route for an invalid configured route', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'missing',
    }).routes
  ).toEqual([{ key: 'first-test', name: 'first' }]);
});

test('creates defensive empty state', () => {
  expect(createInitialState({ routeNames: [] })).toEqual({
    stale: false,
    key: 'navigator-test',
    index: -1,
    routeNames: [],
    routes: [],
  });
});
