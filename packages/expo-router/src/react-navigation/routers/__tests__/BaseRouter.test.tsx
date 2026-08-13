import { expect, jest, test } from '@jest/globals';

import { BaseRouter } from '../BaseRouter';
import * as CommonActions from '../CommonActions';
import type { NavigationState } from '../types';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

const STATE = {
  stale: false as const,
  type: 'test',
  key: 'root',
  index: 1,
  routes: [
    { key: 'foo', name: 'foo' },
    { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
    { key: 'baz', name: 'baz', params: { sort: 'latest' } },
  ],
  routeNames: ['foo', 'bar', 'baz', 'qux'],
};

test('sets params for the focused screen with SET_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, CommonActions.setParams({ answer: 42 }));

  expect(result?.state).toEqual({
    stale: false,
    type: 'test',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar', params: { answer: 42, fruit: 'orange' } },
      { key: 'baz', name: 'baz', params: { sort: 'latest' } },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test('merges params for the source screen with SET_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.setParams({ user: 'jane' }),
    source: 'baz',
  });

  expect(result?.state).toEqual({
    stale: false,
    type: 'test',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'baz', name: 'baz', params: { sort: 'latest', user: 'jane' } },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
  expect(result?.affectedRouteKey).toBe('baz');
});

test('sets params for the source screen with SET_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.setParams({ user: 'jane' }),
    source: 'foo',
  });

  expect(result?.state).toEqual({
    stale: false,
    type: 'test',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo', params: { user: 'jane' } },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'baz', name: 'baz', params: { sort: 'latest' } },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
  expect(result?.affectedRouteKey).toBe('foo');
});

test("doesn't handle SET_PARAMS if source key isn't present", () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.setParams({ answer: 42 }),
    source: 'magic',
  });

  expect(result).toBeNull();
});

test('replaces params for the focused screen with REPLACE_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, CommonActions.replaceParams({ answer: 42 }));

  expect(result?.state).toEqual({
    stale: false,
    type: 'test',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'baz', name: 'baz', params: { sort: 'latest' } },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test('adds params for the source screen with REPLACE_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.replaceParams({ user: 'jane' }),
    source: 'foo',
  });

  expect(result?.state).toEqual({
    stale: false,
    type: 'test',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo', params: { user: 'jane' } },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'baz', name: 'baz', params: { sort: 'latest' } },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
  expect(result?.affectedRouteKey).toBe('foo');
});

test('replaces params for the source screen with REPLACE_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.replaceParams({ user: 'jane' }),
    source: 'baz',
  });

  expect(result?.state).toEqual({
    stale: false,
    type: 'test',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'baz', name: 'baz', params: { user: 'jane' } },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
  expect(result?.affectedRouteKey).toBe('baz');
});

test("doesn't handle REPLACE_PARAMS if source key isn't present", () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.replaceParams({ answer: 42 }),
    source: 'magic',
  });

  expect(result).toBeNull();
});

test('resets state to new state with RESET', () => {
  const routes = [
    { key: 'foo', name: 'foo' },
    { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
    { key: 'baz', name: 'baz' },
    { key: 'qux-1', name: 'qux' },
  ];

  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({
      index: 0,
      routes,
    })
  );

  expect(result?.state).toEqual({ index: 0, routes });
  expect(result?.affectedRouteKey).toBe('foo');
});

test('returns no route key when a partial RESET has no index', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({ routes: [{ name: 'foo' }] })
  );

  expect(result?.affectedRouteKey).toBeUndefined();
});

test('adds keys to routes missing keys during RESET', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({
      ...STATE,
      routes: [...STATE.routes, { name: 'qux' }],
    })
  );

  expect(result?.state).toEqual({
    ...STATE,
    routes: [...STATE.routes, { key: 'qux-test', name: 'qux' }],
  });
  expect(result?.affectedRouteKey).toBe('bar');
});

test("doesn't handle RESET if routes don't match routeNames", () => {
  const routes = [
    { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
    { key: 'baz', name: 'baz' },
    { key: 'qux', name: 'quz' },
  ];

  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({
      index: 0,
      routes,
    })
  );

  expect(result).toBeNull();
});

test("doesn't handle RESET if routeNames don't match", () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({
      ...STATE,
      routeNames: ['ten'],
    })
  );

  expect(result).toBeNull();
});

test("doesn't handle RESET if there are no routes", () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({
      index: 0,
      routes: [],
    })
  );

  expect(result).toBeNull();
});

const DECLARED_ROUTES_STATE: NavigationState = {
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

test('getStateForDeclaredRoutes returns the same state when every route is declared', () => {
  expect(
    BaseRouter.getStateForDeclaredRoutes(DECLARED_ROUTES_STATE, DECLARED_ROUTES_STATE.routeNames)
  ).toBe(DECLARED_ROUTES_STATE);
});

test('getStateForDeclaredRoutes returns an empty state when no route is declared', () => {
  expect(BaseRouter.getStateForDeclaredRoutes(DECLARED_ROUTES_STATE, ['replacement'])).toEqual({
    ...DECLARED_ROUTES_STATE,
    index: -1,
    routes: [],
  });
});

test('getStateForDeclaredRoutes filters routes without reordering or changing unrelated state', () => {
  const result = BaseRouter.getStateForDeclaredRoutes(DECLARED_ROUTES_STATE, [
    'last',
    'focused',
    'first',
  ]);

  expect(result).toEqual({
    ...DECLARED_ROUTES_STATE,
    index: 1,
    routes: [
      DECLARED_ROUTES_STATE.routes[0],
      DECLARED_ROUTES_STATE.routes[2],
      DECLARED_ROUTES_STATE.routes[3],
    ],
  });
  expect(result.history).toBe(DECLARED_ROUTES_STATE.history);
  expect(result.routeNames).toBe(DECLARED_ROUTES_STATE.routeNames);
});

test('getStateForDeclaredRoutes falls back to the first survivor when the focused route is removed', () => {
  const result = BaseRouter.getStateForDeclaredRoutes(DECLARED_ROUTES_STATE, [
    'first',
    'removed',
    'last',
  ]);

  expect(result.index).toBe(0);
  expect(result.routes[result.index]).toBe(DECLARED_ROUTES_STATE.routes[0]);
});

test('getStateForDeclaredRoutes falls back to the first survivor when no earlier route survives', () => {
  const result = BaseRouter.getStateForDeclaredRoutes({ ...DECLARED_ROUTES_STATE, index: 0 }, [
    'focused',
    'last',
  ]);

  expect(result.index).toBe(0);
  expect(result.routes[result.index]).toBe(DECLARED_ROUTES_STATE.routes[2]);
});
