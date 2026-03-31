import { expect, test } from '@jest/globals';

import { checkSerializable } from '../checkSerializable';

test('returns true for serializable object', () => {
  expect(
    checkSerializable({
      index: 0,
      key: '7',
      routeNames: ['foo', 'bar'],
      routes: [
        {
          key: 'foo',
          name: 'foo',
          state: {
            index: 0,
            key: '8',
            routeNames: ['qux', 'lex'],
            routes: [
              { key: 'qux', name: 'qux' },
              { key: 'lex', name: 'lex' },
            ],
          },
        },
      ],
    })
  ).toEqual({ serializable: true });
});

test('returns false for non-serializable object', () => {
  expect(
    checkSerializable({
      index: 0,
      key: '7',
      routeNames: ['foo', 'bar'],
      routes: [
        {
          key: 'foo',
          name: 'foo',
          state: {
            index: 0,
            key: '8',
            routeNames: ['qux', 'lex'],
            routes: [
              { key: 'qux', name: 'qux', params: () => 42 },
              { key: 'lex', name: 'lex' },
            ],
          },
        },
      ],
    })
  ).toEqual({
    serializable: false,
    location: ['routes', 0, 'state', 'routes', 0, 'params'],
    reason: 'Function',
  });

  expect(
    checkSerializable({
      index: 0,
      key: '7',
      routeNames: ['foo', 'bar'],
      routes: [
        {
          key: 'foo',
          name: 'foo',
          state: {
            index: 0,
            key: '8',
            routeNames: ['qux', 'lex'],
            routes: [
              { key: 'qux', name: 'qux', params: { foo: Symbol('test') } },
              { key: 'lex', name: 'lex' },
            ],
          },
        },
      ],
    })
  ).toEqual({
    serializable: false,
    location: ['routes', 0, 'state', 'routes', 0, 'params', 'foo'],
    reason: 'Symbol(test)',
  });
});

test('returns false for circular references', () => {
  const x: any = {
    a: 1,
    b: { b1: 1 },
  };

  x.b.b2 = x;
  x.c = x.b;

  expect(checkSerializable(x)).toEqual({
    serializable: false,
    location: ['b', 'b2'],
    reason: 'Circular reference',
  });

  const y: any = [
    {
      label: 'home',
      children: [{ label: 'product' }],
    },
    { label: 'about', extend: {} },
  ];

  y[0].children[0].parent = y[0];
  y[1].extend.home = y[0].children[0];

  expect(checkSerializable(y)).toEqual({
    serializable: false,
    location: [0, 'children', 0, 'parent'],
    reason: 'Circular reference',
  });

  const z: any = {
    name: 'sun',
    child: [{ name: 'flower' }],
  };

  z.child[0].parent = z;

  expect(checkSerializable(z)).toEqual({
    serializable: false,
    location: ['child', 0, 'parent'],
    reason: 'Circular reference',
  });
});

test("doesn't fail if same object used multiple times", () => {
  const o = { foo: 'bar' };

  expect(
    checkSerializable({
      baz: 'bax',
      first: o,
      second: o,
      stuff: {
        b: o,
      },
    })
  ).toEqual({ serializable: true });
});
