import { act } from '@testing-library/react-native';
import React from 'react';

import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { screen, renderRouter } from '../testing-library';

it('should go back to a previous route in the same stack', () => {
  renderRouter({
    index: () => null,
    '1/_layout': () => <Stack />,
    '1/a': () => null,
    '1/b': () => null,
    '1/c': () => null,
  });

  act(() => router.push('/1/a'));
  act(() => router.push('/1/b'));
  act(() => router.push('/1/c'));

  expect(screen).toHavePathname('/1/c');
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '1', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '1',
        params: {
          params: {},
          screen: 'a',
        },
        path: undefined,
        state: {
          index: 2,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'b', 'c'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'b',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'c',
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
  });

  act(() => router.dismissTo('/1/a'));
  expect(screen).toHavePathname('/1/a');
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '1', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '1',
        params: {
          params: {},
          screen: 'a',
        },
        path: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'b', 'c'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
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
  });
});

it('should go back to a previous route in different stacks', () => {
  renderRouter({
    index: () => null,
    '1/_layout': () => <Stack />,
    '1/a': () => null,
    '1/b': () => null,
    '1/2/_layout': () => <Stack />,
    '1/2/c': () => null,
    '1/2/d': () => null,
    '1/2/3/_layout': () => <Stack />,
    '1/2/3/e': () => null,
    '1/2/3/d': () => null,
  });

  act(() => router.push('/1/a'));
  act(() => router.push('/1/2/c'));
  act(() => router.push('/1/2/3/e'));

  expect(screen).toHavePathname('/1/2/3/e');
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '1', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '1',
        params: {
          params: {},
          screen: 'a',
        },
        path: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'b', '2'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '2',
              params: {
                params: {},
                screen: 'c',
              },
              path: undefined,
              state: {
                index: 1,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['c', 'd', '3'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'c',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: '3',
                    params: {
                      params: {},
                      screen: 'e',
                    },
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
    ],
    stale: false,
    type: 'stack',
  });

  act(() => router.dismissTo('/1/a'));
  expect(screen).toHavePathname('/1/a');
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '1', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '1',
        params: {
          params: {},
          screen: 'a',
        },
        path: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'b', '2'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
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
  });
});

it('will replace the route if the provided href is not in the history', () => {
  renderRouter({
    index: () => null,
    '1/_layout': () => <Stack />,
    '1/a': () => null,
    '1/b': () => null,
    '1/2/_layout': () => <Stack />,
    '1/2/c': () => null,
    '1/2/d': () => null,
    '1/2/3/_layout': () => <Stack />,
    '1/2/3/e': () => null,
    '1/2/3/d': () => null,
  });

  act(() => router.push('/1/a'));
  act(() => router.push('/1/2/c'));

  act(() => router.dismissTo('/1/2/3/e'));

  expect(screen).toHavePathname('/1/2/3/e');
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '1', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '1',
        params: {
          params: {},
          screen: 'a',
        },
        path: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'b', '2'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '2',
              params: {
                params: {},
                screen: 'c',
              },
              path: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['c', 'd', '3'],
                routes: [
                  {
                    key: expect.any(String),
                    name: '3',
                    params: {
                      params: {},
                      screen: 'e',
                    },
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
    ],
    stale: false,
    type: 'stack',
  });
});
