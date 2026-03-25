import { expect, test } from '@jest/globals';

import { getFocusedRouteNameFromRoute } from '../getFocusedRouteNameFromRoute';
import { CHILD_STATE } from '../useRouteCache';

test('gets undefined if there is no nested state', () => {
  expect(getFocusedRouteNameFromRoute({ name: 'Home' })).toBeUndefined();
});

test('gets focused route name from nested state', () => {
  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      state: {
        routes: [{ name: 'Article' }],
      },
    })
  ).toBe('Article');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      state: {
        index: 1,
        routes: [{ name: 'Article' }, { name: 'Chat' }, { name: 'Album' }],
      },
    })
  ).toBe('Chat');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      state: {
        routes: [{ name: 'Article' }, { name: 'Chat' }],
      },
    })
  ).toBe('Chat');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      state: {
        type: 'tab',
        routes: [{ name: 'Article' }, { name: 'Chat' }],
      },
    })
  ).toBe('Article');
});

test('gets focused route name from nested state with symbol', () => {
  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      [CHILD_STATE]: {
        routes: [{ name: 'Article' }],
      },
    })
  ).toBe('Article');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      [CHILD_STATE]: {
        index: 1,
        routes: [{ name: 'Article' }, { name: 'Chat' }, { name: 'Album' }],
      },
    })
  ).toBe('Chat');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      [CHILD_STATE]: {
        routes: [{ name: 'Article' }, { name: 'Chat' }],
      },
    })
  ).toBe('Chat');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      // @ts-expect-error: this isn't in the type defs
      [CHILD_STATE]: {
        type: 'tab',
        routes: [{ name: 'Article' }, { name: 'Chat' }],
      },
    })
  ).toBe('Article');
});

test('gets nested screen in params if present', () => {
  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      params: { screen: 'Chat' },
    })
  ).toBe('Chat');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      params: { screen: 'Chat', initial: false },
    })
  ).toBe('Chat');

  expect(
    getFocusedRouteNameFromRoute({
      name: 'Home',
      params: { screen: {} },
    })
  ).toBeUndefined();
});
