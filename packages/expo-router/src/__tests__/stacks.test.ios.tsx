import React from 'react';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, screen, renderRouter, testRouter } from '../testing-library';
/**
 * Stacks are the most common navigator and have unique navigation actions
 *
 * This file is for testing Stack specific functionality
 */
describe('canDismiss', () => {
  it('should work within the default Stack', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(true);
  });

  it('should always return false while not within a stack', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <Tabs />,
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(false);
  });
});

test('dismiss', () => {
  renderRouter(
    {
      a: () => null,
      b: () => null,
      c: () => null,
      d: () => null,
    },
    {
      initialUrl: '/a',
    }
  );

  act(() => router.push('/b'));
  act(() => router.push('/c'));
  act(() => router.push('/d'));

  expect(screen).toHavePathname('/d');

  act(() => router.dismiss());
  expect(screen).toHavePathname('/c');

  act(() => router.dismiss(2));
  expect(screen).toHavePathname('/a');
});

test('dismissAll', () => {
  renderRouter(
    {
      a: () => null,
      b: () => null,
      c: () => null,
      d: () => null,
    },
    {
      initialUrl: '/a',
    }
  );

  act(() => router.push('/b'));
  act(() => router.push('/c'));
  act(() => router.push('/d'));

  expect(screen).toHavePathname('/d');

  act(() => router.dismissAll());
  expect(screen).toHavePathname('/a');
  expect(router.canDismiss()).toBe(false);
});

test.only('dismissAll nested', () => {
  renderRouter(
    {
      _layout: () => <Tabs />,
      a: () => null,
      b: () => null,
      'one/_layout': () => <Stack />,
      'one/index': () => null,
      'one/page': () => null,
      'one/two/_layout': () => <Stack />,
      'one/two/index': () => null,
      'one/two/page': () => null,
    },
    {
      initialUrl: '/a',
    }
  );

  testRouter.push('/b');

  testRouter.push('/one');
  testRouter.push('/one/page');
  testRouter.push('/one/page');

  testRouter.push('/one/two');
  testRouter.push('/one/two/page');
  testRouter.push('/one/two/page');

  // We should have three top level routes (/a, /b, /one)
  // The last route should include a sub-state for /one/_layout
  // It will have three routes  (/one/index, /one/page, /one/two)
  // The last route should include a sub-state for /one/two/_layout
  expect(store.rootStateSnapshot()).toStrictEqual({
    history: [
      {
        key: expect.any(String),
        type: 'route',
      },
      {
        key: expect.any(String),
        type: 'route',
      },
    ],
    index: 2,
    key: expect.any(String),
    routeNames: ['a', 'b', 'one', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'a',
        params: undefined,
        path: '/a',
      },
      {
        key: expect.any(String),
        name: 'b',
        params: {},
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'one',
        params: {
          params: {
            params: {},
            screen: 'page',
          },
          screen: 'two',
        },
        path: undefined,
        state: {
          index: 2,
          key: expect.any(String),
          routeNames: ['index', 'two', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
            },
            {
              key: expect.any(String),
              name: 'page',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'two',
              params: {
                params: {},
                screen: 'page',
              },
              path: undefined,
              state: {
                index: 1,
                key: expect.any(String),
                routeNames: ['index', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                  },
                  {
                    key: expect.any(String),
                    name: 'page',
                    params: {},
                    path: undefined,
                  },
                ],
                stale: false,
                type: 'stack',
              },
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
      {
        key: expect.any(String),
        name: '_sitemap',
        params: undefined,
      },
      {
        key: expect.any(String),
        name: '+not-found',
        params: undefined,
      },
    ],
    stale: false,
    type: 'tab',
  });

  // This should only dismissing the sub-state for /one/two/_layout
  testRouter.dismissAll();
  expect(screen).toHavePathname('/one/two');
  expect(store.rootStateSnapshot()).toStrictEqual({
    history: [
      {
        key: expect.any(String),
        type: 'route',
      },
      {
        key: expect.any(String),
        type: 'route',
      },
    ],
    index: 2,
    key: expect.any(String),
    routeNames: ['a', 'b', 'one', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'a',
        params: undefined,
        path: '/a',
      },
      {
        key: expect.any(String),
        name: 'b',
        params: {},
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'one',
        params: {
          params: {
            params: {},
            screen: 'page',
          },
          screen: 'two',
        },
        path: undefined,
        state: {
          index: 2,
          key: expect.any(String),
          routeNames: ['index', 'two', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
            },
            {
              key: expect.any(String),
              name: 'page',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'two',
              params: {
                params: {},
                screen: 'page',
              },
              path: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['index', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                  },
                ],
                stale: false,
                type: 'stack',
              },
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
      {
        key: expect.any(String),
        name: '_sitemap',
        params: undefined,
      },
      {
        key: expect.any(String),
        name: '+not-found',
        params: undefined,
      },
    ],
    stale: false,
    type: 'tab',
  });

  // This should only dismissing the sub-state for /one/_layout
  testRouter.dismissAll();
  expect(screen).toHavePathname('/one');
  expect(store.rootStateSnapshot()).toStrictEqual({
    history: [
      {
        key: expect.any(String),
        type: 'route',
      },
      {
        key: expect.any(String),
        type: 'route',
      },
    ],
    index: 2,
    key: expect.any(String),
    routeNames: ['a', 'b', 'one', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'a',
        params: undefined,
        path: '/a',
      },
      {
        key: expect.any(String),
        name: 'b',
        params: {},
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'one',
        params: {
          params: {
            params: {},
            screen: 'page',
          },
          screen: 'two',
        },
        path: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'two', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
      {
        key: expect.any(String),
        name: '_sitemap',
        params: undefined,
      },
      {
        key: expect.any(String),
        name: '+not-found',
        params: undefined,
      },
    ],
    stale: false,
    type: 'tab',
  });

  // Cannot dismiss again as we are at the root Tabs layout
  expect(router.canDismiss()).toBe(false);
});

test('pushing in a nested stack should only rerender the nested stack', () => {
  const RootLayout = jest.fn(() => <Stack />);
  const NestedLayout = jest.fn(() => <Stack />);
  const NestedNestedLayout = jest.fn(() => <Stack />);

  renderRouter(
    {
      _layout: RootLayout,
      '[one]/_layout': NestedLayout,
      '[one]/a': () => null,
      '[one]/b': () => null,
      '[one]/[two]/_layout': NestedNestedLayout,
      '[one]/[two]/a': () => null,
    },
    {
      initialUrl: '/one/a',
    }
  );

  testRouter.push('/one/b');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(2);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(0);

  testRouter.push('/one/two/a');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(3);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(1);
});
