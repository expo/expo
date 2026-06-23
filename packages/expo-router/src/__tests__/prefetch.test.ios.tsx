import { screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { Link } from '../link';
import {
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../navigationParams';
import type { NativeStackNavigationOptions } from '../react-navigation/native-stack';
import { renderRouter } from '../testing-library';

type HeaderTitleFunction = Extract<
  NativeStackNavigationOptions['headerTitle'],
  (...args: any) => any
>;

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
        },
      },
    ],
  });

  act(() => {
    router.prefetch('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'test'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {},
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
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
        },
      },
    ],
  });

  act(() => {
    router.prefetch('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['(a)/test', '(b)/test', '(a)/index', '(b)/index'],
          routes: [
            {
              key: expect.any(String),
              name: '(a)/index',
              params: undefined,
              path: '/',
            },
            {
              key: expect.any(String),
              name: '(a)/test',
              params: {},
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
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
        },
      },
    ],
  });

  act(() => {
    router.prefetch('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['(b)/test', '(a)/index', '(b)/index', '(a)/(c)/test'],
          routes: [
            {
              key: expect.any(String),
              name: '(a)/index',
              params: undefined,
              path: '/',
            },
            {
              key: expect.any(String),
              name: '(a)/(c)/test',
              params: {},
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
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
        },
      },
    ],
  });

  act(() => {
    router.prefetch('./test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'test'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {},
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
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
        },
      },
    ],
  });

  act(() => {
    router.prefetch('./test?foo=bar');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'test'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {
                foo: 'bar',
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
              },
            },
          ],
        },
      },
    ],
  });

  act(() => {
    router.prefetch('/directory');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'directory'],
          routes: [
            {
              key: expect.any(String),
              name: 'directory',
              params: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['index'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: undefined,
                    path: '/directory',
                  },
                  {
                    key: expect.any(String),
                    name: 'index',
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
              },
            },
          ],
        },
      },
    ],
  });

  act(() => {
    router.prefetch('/directory/apple/banana');
  });

  expect(screen).toHavePathname('/directory');
  expect(jestFn.mock.calls).toEqual([['apple'], ['banana'], ['index']]);

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'directory'],
          routes: [
            {
              key: expect.any(String),
              name: 'directory',
              params: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['index', 'apple'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: undefined,
                    path: '/directory',
                  },
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
                    // A preloaded route is a real route now, so its nested navigator state is
                    // materialized from the nested-navigation params.
                    state: {
                      index: 0,
                      key: expect.any(String),
                      routeNames: ['banana'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'banana',
                          params: {
                            params: {},
                            screen: 'index',
                          },
                          path: undefined,
                          state: {
                            index: 0,
                            key: expect.any(String),
                            routeNames: ['index'],
                            routes: [
                              {
                                key: expect.any(String),
                                name: 'index',
                                params: {},
                                path: undefined,
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
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });

  act(() => {
    router.prefetch('/directory/test');
  });

  expect(screen).toHavePathname('/directory/apple/banana');

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'directory'],
          routes: [
            {
              key: expect.any(String),
              name: 'directory',
              params: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['test', 'apple'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'apple',
                    params: undefined,
                    state: {
                      index: 0,
                      key: expect.any(String),
                      routeNames: ['banana'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'banana',
                          params: undefined,
                          state: {
                            index: 0,
                            key: expect.any(String),
                            routeNames: ['index'],
                            routes: [
                              {
                                key: expect.any(String),
                                name: 'index',
                                params: undefined,
                                path: '/directory/apple/banana',
                              },
                            ],
                            stale: false,
                          },
                        },
                      ],
                      stale: false,
                    },
                  },
                  {
                    key: expect.any(String),
                    name: 'test',
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
    // TODO(@ubax): find out why this is called twice on initial render
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'custom-title' }],
  ]);

  // Check that it actually prefetched the screen
  expect(screen.UNSAFE_getByProps({ title: 'custom-title' })).toBeDefined();

  headerTitle.mockClear();
  act(() => router.push('/second'));

  expect(headerTitle.mock.calls).toStrictEqual([
    // Call after navigation
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'custom-title' }],
    // Call from the <Stack.Screen />
    [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    [{ tintColor: 'rgb(0, 122, 255)', children: 'Should only change after focus' }],
  ]);
});

it('can still use <Screen /> while prefetching in tabs', () => {
  const headerTitle = jest.fn((...args: Parameters<HeaderTitleFunction>) => null);
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

  // The prefetched route is inserted at the tail of state.routes and renders its
  // configured header ('custom-title') during prefetch, before the index re-renders.
  expect(headerTitle.mock.calls.map((call) => call[0].children)).toStrictEqual([
    'index',
    'custom-title',
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

it('stamps zoom transition screen ID on preloaded route', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    target: () => null,
  });

  act(() => {
    router.prefetch({
      pathname: '/target',
      params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'test-source-id',
      },
    });
  });

  const state = (screen as ReturnType<typeof renderRouter>).getRouterState();
  const innerState = state?.routes[0]!.state;
  if (!innerState || !('routes' in innerState) || typeof innerState.index !== 'number') {
    throw new Error(
      `Expected the root route to hold a navigator state with a 'routes' array and a numeric 'index', but got ${JSON.stringify(innerState)}`
    );
  }
  // The preloaded route is the first inactive route (position index + 1).
  const preloadedRoute = innerState.routes[innerState.index + 1]!;

  expect(preloadedRoute.name).toBe('target');
  expect(preloadedRoute.params).toHaveProperty(
    INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
    preloadedRoute.key
  );
});

it('does not stamp zoom transition screen ID without zoom source param', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    target: () => null,
  });

  act(() => {
    router.prefetch('/target');
  });

  const state = (screen as ReturnType<typeof renderRouter>).getRouterState();
  const innerState = state?.routes[0]!.state;
  if (!innerState || !('routes' in innerState) || typeof innerState.index !== 'number') {
    throw new Error(
      `Expected the root route to hold a navigator state with a 'routes' array and a numeric 'index', but got ${JSON.stringify(innerState)}`
    );
  }
  // The preloaded route is the first inactive route (position index + 1).
  const preloadedRoute = innerState.routes[innerState.index + 1]!;

  expect(preloadedRoute.name).toBe('target');
  expect(preloadedRoute.params).not.toHaveProperty(
    INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME
  );
});

it('stamps zoom transition screen ID on preloaded route that is navigated to', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    target: () => <Text testID="target">Target</Text>,
  });

  act(() => {
    router.prefetch({
      pathname: '/target',
      params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'test-source-id',
      },
    });
  });

  // Navigate to the preloaded route (with zoom params so it goes through the NAVIGATE/PUSH stamping)
  act(() => {
    router.push({
      pathname: '/target',
      params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'test-source-id',
      },
    });
  });

  const state = (screen as ReturnType<typeof renderRouter>).getRouterState();
  const innerState = state?.routes[0]!.state;
  if (!innerState || !('routes' in innerState) || typeof innerState.index !== 'number') {
    throw new Error(
      `Expected the root route to hold a navigator state with a 'routes' array and a numeric 'index', but got ${JSON.stringify(innerState)}`
    );
  }
  const navigatedRoute = innerState.routes[innerState.routes.length - 1]!;

  expect(navigatedRoute.name).toBe('target');
  expect(navigatedRoute.params).toHaveProperty(
    INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
    navigatedRoute.key
  );
});
