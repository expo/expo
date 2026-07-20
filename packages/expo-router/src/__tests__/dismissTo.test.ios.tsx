import { screen, act } from '@testing-library/react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { renderRouter } from '../testing-library';

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
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              state: {
                index: 2,
                key: expect.any(String),
                routeNames: ['a', 'b', 'c'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                  },
                  {
                    key: expect.any(String),
                    name: 'b',
                    params: {},
                  },
                  {
                    key: expect.any(String),
                    name: 'c',
                    params: {},
                  },
                ],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  act(() => router.dismissTo('/1/a'));
  expect(screen).toHavePathname('/1/a');
  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['a', 'b', 'c'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                  },
                ],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
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
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              state: {
                index: 1,
                key: expect.any(String),
                routeNames: ['a', 'b', '2'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                  },
                  {
                    key: expect.any(String),
                    name: '2',
                    params: {},
                    state: {
                      index: 1,
                      key: expect.any(String),
                      routeNames: ['c', 'd', '3'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'c',
                          params: {},
                        },
                        {
                          key: expect.any(String),
                          name: '3',
                          params: {},
                          state: {
                            index: 0,
                            key: expect.any(String),
                            routeNames: ['e', 'd'],
                            routes: [
                              {
                                key: expect.any(String),
                                name: 'e',
                                params: {},
                              },
                            ],
                            stale: false,
                          },
                        },
                      ],
                      stale: false,
                    },
                  },
                ],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  act(() => router.dismissTo('/1/a'));
  expect(screen).toHavePathname('/1/a');
  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['a', 'b', '2'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                  },
                ],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
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
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              state: {
                index: 1,
                key: expect.any(String),
                routeNames: ['a', 'b', '2'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                  },
                  {
                    key: expect.any(String),
                    name: '2',
                    params: {},
                    state: {
                      index: 0,
                      key: expect.any(String),
                      routeNames: ['c', 'd', '3'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: '3',
                          params: {},
                          state: {
                            index: 0,
                            key: expect.any(String),
                            routeNames: ['e', 'd'],
                            routes: [
                              {
                                key: expect.any(String),
                                name: 'e',
                                params: {},
                              },
                            ],
                            stale: false,
                          },
                        },
                      ],
                      stale: false,
                    },
                  },
                ],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  });
});
