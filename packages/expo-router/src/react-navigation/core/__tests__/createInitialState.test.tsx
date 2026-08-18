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

test('focuses a nested route with its params and path', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'first',
      routeParams: {
        screen: 'second',
        params: { answer: 42 },
        path: '/second',
      },
    })
  ).toEqual({
    stale: false,
    key: 'navigator-test',
    index: 0,
    routeNames,
    routes: [
      {
        key: 'second-test',
        name: 'second',
        params: { answer: 42 },
        path: '/second',
      },
    ],
  });
});

test('prepends the initial route for nested navigation with initial false', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'first',
      routeParams: {
        screen: 'second',
        initial: false,
        params: { answer: 42 },
        path: '/second',
      },
    })
  ).toEqual({
    stale: false,
    key: 'navigator-test',
    index: 1,
    routeNames,
    routes: [
      { key: 'first-test', name: 'first' },
      {
        key: 'second-test',
        name: 'second',
        params: { answer: 42 },
        path: '/second',
      },
    ],
  });
});

test('does not duplicate matching initial and focused routes', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'second',
      routeParams: { screen: 'second', initial: false },
    }).routes
  ).toStrictEqual([{ key: 'second-test', name: 'second' }]);
});

test('falls back to the first route for an invalid configured route', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'missing',
    }).routes
  ).toEqual([{ key: 'first-test', name: 'first' }]);
});

test.each([undefined, false])(
  'does not copy params from an invalid nested route with initial %s',
  (initial) => {
    expect(
      createInitialState({
        routeNames,
        initialRouteName: 'first',
        routeParams: {
          screen: 'missing',
          initial,
          params: { answer: 42 },
          path: '/missing',
        },
      }).routes
    ).toEqual([{ key: 'first-test', name: 'first' }]);
  }
);

test('omits absent nested params and path', () => {
  expect(
    createInitialState({
      routeNames,
      routeParams: { screen: 'second' },
    }).routes
  ).toStrictEqual([{ key: 'second-test', name: 'second' }]);
});

test('copies nested params', () => {
  const params = { answer: 42 };
  const state = createInitialState({
    routeNames,
    routeParams: { screen: 'second', params },
  });

  expect(state.routes[0]?.params).toEqual(params);
  expect(state.routes[0]?.params).not.toBe(params);
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
