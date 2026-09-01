import { expect, test } from '@jest/globals';

import { getHistoryLength } from '../stack';

const routes = [
  { name: 'one', key: 'one-key' },
  { name: 'two', key: 'two-key' },
  { name: 'three', key: 'three-key' },
];

test('uses index for tab and drawer states without history', () => {
  expect(getHistoryLength({ type: 'tab', routes, index: 1 })).toBe(2);
  expect(getHistoryLength({ type: 'drawer', routes, index: 0 })).toBe(1);
  expect(getHistoryLength({ type: 'tab', routes: [], index: -1 })).toBe(0);
});

test('uses full history before index', () => {
  expect(
    getHistoryLength({
      type: 'tab',
      routes,
      index: 0,
      history: [{ key: 'one' }, { key: 'two' }],
    })
  ).toBe(2);
});

test('keeps stack and typeless fallbacks', () => {
  expect(getHistoryLength({ type: 'stack', routes, index: 1 })).toBe(2);
  expect(getHistoryLength({ routes })).toBe(3);
});
