import { expect, jest, test } from '@jest/globals';

import {
  createNavigatorStateKey,
  createRouteKeyMinter,
  getChainFromRouteKey,
  getChainFromStateKey,
  ROOT_CHAIN,
} from '../stateKeys';

const state = {
  stale: false as const,
  key: createNavigatorStateKey('0-3'),
  routeKeySeq: 1,
  index: 0,
  routeNames: ['c-0', 'c'],
  routes: [{ key: 'c:0-3-0', name: 'c' }],
};

test('creates navigator keys from their parent route chain', () => {
  expect(createNavigatorStateKey(ROOT_CHAIN)).toBe('navigator:root');
  expect(createNavigatorStateKey('0-3')).toBe('navigator:0-3');
});

test('mints deterministic sequential route keys from the input state', () => {
  const first = createRouteKeyMinter(state);
  const second = createRouteKeyMinter(state);

  expect([first.mint('c-0'), first.mint('c'), first.routeKeySeq]).toEqual([
    'c-0:0-3-1',
    'c:0-3-2',
    3,
  ]);
  expect([second.mint('c-0'), second.mint('c'), second.routeKeySeq]).toEqual([
    'c-0:0-3-1',
    'c:0-3-2',
    3,
  ]);
});

test('starts a root route chain with its sequence', () => {
  const minter = createRouteKeyMinter({ ...state, key: 'navigator:root', routeKeySeq: 0 });

  expect(minter.mint('index')).toBe('index:0');
  expect(minter.routeKeySeq).toBe(1);
});

test('extracts chains without ambiguity from names containing dashes and digits', () => {
  expect(getChainFromRouteKey('c-0:3-1')).toBe('3-1');
  expect(getChainFromRouteKey('c:0-3-1')).toBe('0-3-1');
  expect(getChainFromStateKey('navigator:0-3-1')).toBe('0-3-1');
});

test('warns and preserves a route key without a chain separator', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  expect(getChainFromRouteKey('legacy-key')).toBe('legacy-key');
  expect(warn).toHaveBeenCalledWith(
    'The route key "legacy-key" has no chain separator. Expo Router-generated route keys include a ":" separator.'
  );

  warn.mockRestore();
});
