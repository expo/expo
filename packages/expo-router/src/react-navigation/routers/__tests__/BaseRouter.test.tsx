import { expect, jest, test } from '@jest/globals';

import { BaseRouter } from '../BaseRouter';
import * as CommonActions from '../CommonActions';

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

  expect(result).toEqual({
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

  expect(result).toEqual({
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
});

test('sets params for the source screen with SET_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.setParams({ user: 'jane' }),
    source: 'foo',
  });

  expect(result).toEqual({
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

  expect(result).toEqual({
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

  expect(result).toEqual({
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
});

test('replaces params for the source screen with REPLACE_PARAMS', () => {
  const result = BaseRouter.getStateForAction(STATE, {
    ...CommonActions.replaceParams({ user: 'jane' }),
    source: 'baz',
  });

  expect(result).toEqual({
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

  expect(result).toEqual({ index: 0, routes });
});

test('adds keys to routes missing keys during RESET', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    CommonActions.reset({
      ...STATE,
      routes: [...STATE.routes, { name: 'qux' }],
    })
  );

  expect(result).toEqual({
    ...STATE,
    routes: [...STATE.routes, { key: 'qux-test', name: 'qux' }],
  });
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

test('returns the state on ROUTE_NAMES_CHANGED when route names already match', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    { type: 'ROUTE_NAMES_CHANGED' },
    {
      routeNames: ['qux', 'baz', 'bar', 'foo'],
      routeParamList: {},
      routeGetIdList: {},
    }
  );

  expect(result).toBe(STATE);
});

test('updates route names and filters routes on ROUTE_NAMES_CHANGED', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    { type: 'ROUTE_NAMES_CHANGED' },
    {
      routeNames: ['foo', 'bar'],
      routeParamList: {},
      routeGetIdList: {},
    }
  );

  expect(result).toEqual({
    ...STATE,
    index: 1,
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
    ],
  });
});

test('keeps the focused route on ROUTE_NAMES_CHANGED when an earlier route is removed', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    { type: 'ROUTE_NAMES_CHANGED' },
    {
      routeNames: ['bar', 'baz'],
      routeParamList: {},
      routeGetIdList: {},
    }
  );

  expect(result).toEqual({
    ...STATE,
    index: 0,
    routeNames: ['bar', 'baz'],
    routes: [
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'baz', name: 'baz', params: { sort: 'latest' } },
    ],
  });
});

test('clamps the index on ROUTE_NAMES_CHANGED when the focused route is removed', () => {
  const result = BaseRouter.getStateForAction(
    STATE,
    { type: 'ROUTE_NAMES_CHANGED' },
    {
      routeNames: ['foo'],
      routeParamList: {},
      routeGetIdList: {},
    }
  );

  expect(result).toEqual({
    ...STATE,
    index: 0,
    routeNames: ['foo'],
    routes: [{ key: 'foo', name: 'foo' }],
  });
});

test("doesn't handle ROUTE_NAMES_CHANGED without router config options", () => {
  expect(BaseRouter.getStateForAction(STATE, { type: 'ROUTE_NAMES_CHANGED' })).toBeNull();
});

test("doesn't handle ROUTE_NAMES_CHANGED when no route survives", () => {
  expect(
    BaseRouter.getStateForAction(
      STATE,
      { type: 'ROUTE_NAMES_CHANGED' },
      {
        routeNames: ['ten'],
        routeParamList: {},
        routeGetIdList: {},
      }
    )
  ).toBeNull();
});
