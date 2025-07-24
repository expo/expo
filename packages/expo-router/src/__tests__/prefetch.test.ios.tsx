import React from 'react';
import { Text } from 'react-native';

import { Link } from '../exports';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { screen, renderRouter, act } from '../testing-library';

it('prefetch a sibling route', () => {
  renderRouter({
    index: function Index() {
      return null;
    },
    test: function Test() {
      return null;
    },
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              path: '/',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: 'test',
              params: {},
            },
          ],
          routeNames: ['index', 'test', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
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

it('will prefetch the correct route within a group', () => {
  renderRouter({
    '(a)/index': () => null,
    '(a)/test': () => null,
    '(b)/index': () => null,
    '(b)/test': () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: '(a)/index',
              path: '/',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: '(a)/test',
              params: {},
            },
          ],
          routeNames: ['(a)/test', '(b)/test', '(a)/index', '(b)/index', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: '(a)/index',
              params: undefined,
              path: '/',
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

it('will prefetch the correct route within nested groups', () => {
  renderRouter({
    '(a)/index': () => null,
    '(a)/(c)/test': () => null,
    '(b)/index': () => null,
    '(b)/test': () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: '(a)/index',
              path: '/',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: '(a)/(c)/test',
              params: {},
            },
          ],
          routeNames: [
            '(b)/test',
            '(a)/index',
            '(b)/index',
            '(a)/(c)/test',
            '_sitemap',
            '+not-found',
          ],
          routes: [
            {
              key: expect.any(String),
              name: '(a)/index',
              params: undefined,
              path: '/',
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

it('works with relative Href', () => {
  renderRouter({
    index: () => null,
    test: () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              path: '/',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('./test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: 'test',
              params: {},
            },
          ],
          routeNames: ['index', 'test', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
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

it('works with params', () => {
  renderRouter({
    index: () => null,
    test: () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              path: '/',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('./test?foo=bar');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: 'test',
              params: {
                foo: 'bar',
              },
            },
          ],
          routeNames: ['index', 'test', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
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

it('ignores the current route', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'directory/_layout': () => <Stack />,
      'directory/index': () => null,
    },
    {
      initialUrl: '/directory',
    }
  );

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'directory',
              state: {
                routes: [
                  {
                    name: 'index',
                    path: '/directory',
                  },
                ],
                stale: true,
              },
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('/directory');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', '_sitemap', 'directory', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'directory',
              params: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                preloadedRoutes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                  },
                ],
                routeNames: ['index'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: undefined,
                    path: '/directory',
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

it('can prefetch a deeply nested route', () => {
  const jestFn = jest.fn();

  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'directory/_layout': () => <Stack />,
      'directory/index': () => null,
      'directory/apple/_layout': () => {
        jestFn('apple');
        return <Stack />;
      },
      'directory/apple/banana/_layout': () => {
        jestFn('banana');
        return <Stack />;
      },
      'directory/apple/banana/index': () => {
        jestFn('index');
        return null;
      },
    },
    {
      initialUrl: '/directory',
    }
  );

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'directory',
              state: {
                routes: [
                  {
                    name: 'index',
                    path: '/directory',
                  },
                ],
                stale: true,
              },
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('/directory/apple/banana');
  });

  expect(screen).toHavePathname('/directory');
  expect(jestFn.mock.calls).toEqual([['apple'], ['banana'], ['index']]);

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', '_sitemap', 'directory', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'directory',
              params: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                preloadedRoutes: [
                  {
                    key: expect.any(String),
                    name: 'apple',
                    params: {
                      params: {
                        params: {},
                        screen: 'index',
                      },
                      screen: 'banana',
                    },
                  },
                ],
                routeNames: ['index', 'apple'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: undefined,
                    path: '/directory',
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

it('can prefetch a parent route', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'directory/_layout': () => <Stack />,
      'directory/test': () => null,
      'directory/apple/_layout': () => {
        return <Stack />;
      },
      'directory/apple/banana/_layout': () => {
        return <Stack />;
      },
      'directory/apple/banana/index': () => {
        return null;
      },
    },
    {
      initialUrl: '/directory/apple/banana',
    }
  );

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'directory',
              state: {
                routes: [
                  {
                    name: 'apple',
                    state: {
                      routes: [
                        {
                          name: 'banana',
                          state: {
                            routes: [
                              {
                                name: 'index',
                                path: '/directory/apple/banana',
                              },
                            ],
                            stale: true,
                          },
                        },
                      ],
                      stale: true,
                    },
                  },
                ],
                stale: true,
              },
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.prefetch('/directory/test');
  });

  expect(screen).toHavePathname('/directory/apple/banana');

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', '_sitemap', 'directory', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'directory',
              params: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                preloadedRoutes: [
                  {
                    key: expect.any(String),
                    name: 'test',
                    params: {},
                  },
                ],
                routeNames: ['test', 'apple'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'apple',
                    params: undefined,
                    state: {
                      routes: [
                        {
                          name: 'banana',
                          state: {
                            routes: [
                              {
                                name: 'index',
                                path: '/directory/apple/banana',
                              },
                            ],
                            stale: true,
                          },
                        },
                      ],
                      stale: true,
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
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('can still use <Screen /> while prefetching in stack', () => {
  const headerTitle = jest.fn(() => null);
  renderRouter({
    _layout: () => (
      <Stack screenOptions={{ headerTitle }}>
        <Stack.Screen name="index" options={{ title: 'index' }} />
        <Stack.Screen name="second" options={{ title: 'custom-title' }} />
      </Stack>
    ),
    index: () => <Link href="/second" prefetch />,
    second: () => {
      return (
        <>
          <Stack.Screen options={{ title: 'Should only change after focus' }} />
          <Text testID="second">Second</Text>
        </>
      );
    },
  });

  expect(headerTitle.mock.calls).toStrictEqual([
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'custom-title' }],
  ]);

  // Check that it actually prefetched the screen
  expect(screen.UNSAFE_getByProps({ title: 'custom-title' })).toBeDefined();

  headerTitle.mockClear();
  act(() => router.push('/second'));

  expect(headerTitle.mock.calls).toStrictEqual([
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'custom-title' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'custom-title' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'Should only change after focus' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'custom-title' }],
  ]);
});

it('can still use <Screen /> while prefetching in tabs', () => {
  const headerTitle = jest.fn(() => null);
  renderRouter({
    _layout: () => (
      <Tabs screenOptions={{ headerTitle }}>
        <Tabs.Screen name="index" options={{ title: 'index' }} />
        <Tabs.Screen name="second" options={{ title: 'custom-title' }} />
      </Tabs>
    ),
    index: () => <Link href="/second" prefetch />,
    second: () => {
      return (
        <>
          <Stack.Screen options={{ title: 'Should only change after focus' }} />
          <Text testID="second">Second</Text>
        </>
      );
    },
  });

  expect(headerTitle.mock.calls.map((call) => call[0].children)).toStrictEqual([
    'index',
    'index',
    'custom-title',
    'index',
    'Should only change after focus',
  ]);

  headerTitle.mockClear();
  act(() => router.push('/second'));

  expect(headerTitle.mock.calls.map((call) => call[0].children)).toStrictEqual([
    'index',
    'Should only change after focus',
    'index',
    'Should only change after focus',
    'index',
  ]);
});
