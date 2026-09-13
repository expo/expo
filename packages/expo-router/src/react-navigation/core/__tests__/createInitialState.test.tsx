import { expect, test } from '@jest/globals';

import { createInitialState } from '../createInitialState';

const routeNames = ['first', 'second'];
const parentChain = '0-2';

test('creates sparse state focused on the first route by default', () => {
  expect(createInitialState({ routeNames, parentChain })).toEqual({
    stale: false,
    key: 'navigator:0-2',
    routeKeySeq: 1,
    index: 0,
    routeNames,
    routes: [{ key: 'first:0-2-0', name: 'first' }],
  });
});

test('focuses a valid configured initial route', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'second',
      parentChain,
    })
  ).toEqual({
    stale: false,
    key: 'navigator:0-2',
    routeKeySeq: 1,
    index: 0,
    routeNames,
    routes: [{ key: 'second:0-2-0', name: 'second' }],
  });
});

test('falls back to the first route for an invalid configured route', () => {
  expect(
    createInitialState({
      routeNames,
      initialRouteName: 'missing',
      parentChain,
    }).routes
  ).toEqual([{ key: 'first:0-2-0', name: 'first' }]);
});

test('creates defensive empty state', () => {
  expect(createInitialState({ routeNames: [], parentChain })).toEqual({
    stale: false,
    key: 'navigator:0-2',
    routeKeySeq: 0,
    index: -1,
    routeNames: [],
    routes: [],
  });
});

test('returns deeply equal states for the same input', () => {
  expect(createInitialState({ routeNames, parentChain })).toEqual(
    createInitialState({ routeNames, parentChain })
  );
});

test('uses the parent chain to keep navigator and route keys distinct', () => {
  const first = createInitialState({ routeNames, parentChain: '0' });
  const second = createInitialState({ routeNames, parentChain: '1' });

  expect(first.key).not.toBe(second.key);
  expect(first.routes[0]!.key).not.toBe(second.routes[0]!.key);
});
