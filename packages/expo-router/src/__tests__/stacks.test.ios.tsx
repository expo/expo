import { act, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { expectAssignable } from 'tsd';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import type { StackScreenProps } from '../layouts/stack-utils';
import { renderRouter, testRouter } from '../testing-library';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;
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

test('dismissAll nested', () => {
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
  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
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
          preloadedRouteKeys: [],
          routeNames: ['a', 'b', 'one'],
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
              path: undefined,
              state: {
                index: 3,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['index', 'two', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: 'page',
                    params: {},
                    path: undefined,
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
                    path: undefined,
                    state: {
                      index: 2,
                      key: expect.any(String),
                      preloadedRoutes: [],
                      routeNames: ['index', 'page'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'index',
                          params: {},
                          path: undefined,
                        },
                        {
                          key: expect.any(String),
                          name: 'page',
                          params: {},
                          path: undefined,
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
          ],
          stale: false,
          type: 'tab',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  // This should only dismissing the sub-state for /one/two/_layout
  testRouter.dismissAll();
  expect(screen).toHavePathname('/one/two');
  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
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
          preloadedRouteKeys: [],
          routeNames: ['a', 'b', 'one'],
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
              path: undefined,
              state: {
                index: 3,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['index', 'two', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: 'page',
                    params: {},
                    path: undefined,
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
                    path: undefined,
                    state: {
                      index: 0,
                      key: expect.any(String),
                      preloadedRoutes: [],
                      routeNames: ['index', 'page'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'index',
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
          ],
          stale: false,
          type: 'tab',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  // This should only dismissing the sub-state for /one/_layout
  testRouter.dismissAll();
  expect(screen).toHavePathname('/one');
  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
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
          preloadedRouteKeys: [],
          routeNames: ['a', 'b', 'one'],
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
              path: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['index', 'two', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
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
          type: 'tab',
        },
      },
    ],
    stale: false,
    type: 'stack',
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
  expect(NestedLayout).toHaveBeenCalledTimes(1);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(0);

  testRouter.push('/one/two/a');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(1);
  // TODO(@ubax): Investigate extra render caused by react-navigation params cleanup
  expect(NestedNestedLayout).toHaveBeenCalledTimes(2);
});

test('can preserve the nested initialRouteName when navigating to a nested stack', () => {
  renderRouter({
    index: () => <Text testID="link">Index</Text>,
    '/fruit/_layout': {
      unstable_settings: {
        anchor: 'apple',
      },
      default: () => {
        return <Stack />;
      },
    },
    '/fruit/apple': () => <Text testID="apple">Apple</Text>,
    '/fruit/banana': () => <Text testID="banana">Banana</Text>,
  });

  act(() => router.push('/fruit/banana', { withAnchor: true }));
  expect(screen.getByTestId('banana')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('apple')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('link')).toBeDefined();
});

describe('presentation validation', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('throws when an invalid presentation is set via screen options', () => {
    expect(() => {
      renderRouter({
        _layout: () => <Stack screenOptions={{ presentation: 'xyz' as any }} />,
        index: () => <Text>Index</Text>,
      });
    }).toThrow('Invalid presentation value "xyz"');
  });

  it('throws when an invalid presentation is set via layout options', () => {
    expect(() => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" options={{ presentation: 'xyz' as any }} />
          </Stack>
        ),
        index: () => <Text>Index</Text>,
      });
    }).toThrow('Invalid presentation value "xyz"');
  });

  it('throws when an invalid presentation is set via page-level Stack.Screen', () => {
    expect(() => {
      renderRouter({
        index: () => (
          <>
            <Stack.Screen options={{ presentation: 'xyz' as any }} />
            <Text>Index</Text>
          </>
        ),
      });
    }).toThrow('Invalid presentation value "xyz"');
  });
});

describe('singular', () => {
  test('singular should only allow one instance of a screen', () => {
    renderRouter(
      {
        _layout: () => (
          <Stack>
            <Stack.Screen name="[slug]" dangerouslySingular />
          </Stack>
        ),
        '[slug]': () => <Text>slug</Text>,
      },
      {
        initialUrl: '/apple',
      }
    );

    expect(screen).toHaveRouterState({
      routes: [
        {
          name: '__root',
          params: {
            slug: 'apple',
          },
          state: {
            routes: [
              {
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: '/apple',
              },
            ],
          },
        },
      ],
    });

    // Normally pushing would add a new route, but since we have singular set to true
    // Nothing should happen, as the current route is already the same as the target route
    act(() => router.push('/apple'));
    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
      preloadedRoutes: [],
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: {
            slug: 'apple',
          },
          state: {
            index: 0,
            key: expect.any(String),
            preloadedRoutes: [],
            routeNames: ['[slug]'],
            routes: [
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: '/apple',
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

    // Adding a new screen with different params should work
    act(() => router.push('/banana'));
    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
      preloadedRoutes: [],
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: {
            slug: 'apple',
          },
          state: {
            index: 1,
            key: expect.any(String),
            preloadedRoutes: [],
            routeNames: ['[slug]'],
            routes: [
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: '/apple',
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'banana',
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
    });

    // Normally pushing would add a new route, but since we have singular set to true
    // It rearranges the Stack to move /apple to the current route
    act(() => router.push('/apple'));
    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
      preloadedRoutes: [],
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: {
            slug: 'apple',
          },
          state: {
            index: 1,
            key: expect.any(String),
            preloadedRoutes: [],
            routeNames: ['[slug]'],
            routes: [
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'banana',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: '/apple',
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
});

describe('Stack.Screen types', () => {
  it('accepts layout navigation props', () => {
    expectAssignable<StackScreenProps>({ name: 'home', redirect: true });
    expectAssignable<StackScreenProps>({ name: 'profile', initialParams: { id: '123' } });
    expectAssignable<StackScreenProps>({ name: 'settings', dangerouslySingular: true });
    expectAssignable<StackScreenProps>({
      name: 'details',
      dangerouslySingular: (name, params) => `${name}-${params.id}`,
    });
    expectAssignable<StackScreenProps>({
      name: 'page',
      listeners: { transitionStart: () => {} },
    });
    expectAssignable<StackScreenProps>({
      name: 'page',
      listeners: ({ route, navigation }) => ({ focus: () => {} }),
    });
    expectAssignable<StackScreenProps>({
      name: 'page',
      getId: ({ params }) => params?.id,
    });
  });

  it('accepts function-form options', () => {
    expectAssignable<StackScreenProps>({
      options: ({ route }) => ({ title: route.params?.name as string }),
    });
    expectAssignable<StackScreenProps>({
      name: 'profile',
      options: ({ route, navigation }) => ({ title: `Profile: ${route.params?.id}` }),
    });
  });
});

describe('function-form options', () => {
  beforeEach(() => {
    MockedScreenStackItem.mockClear();
  });

  it('passes resolved function-form options to ScreenStackItem', () => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={({ route }) => ({ title: `Page: ${route.name}` })} />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(MockedScreenStackItem.mock.calls[0][0].headerConfig?.title).toBe('Page: index');
  });

  it('calls function-form options with route and navigation', () => {
    const optionsFn = jest.fn(({ route }) => ({ title: `Page: ${route.name}` }));

    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={optionsFn} />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
    });

    expect(optionsFn).toHaveBeenCalled();
    const arg = optionsFn.mock.calls[0][0];
    expect(arg).toHaveProperty('route');
    expect(arg).toHaveProperty('navigation');
    expect(arg.route).toHaveProperty('name', 'index');
  });

  it('passes updated options to ScreenStackItem after navigation', () => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={({ route }) => ({ title: `Page: ${route.name}` })} />
          <Stack.Screen
            name="profile"
            options={({ route }) => ({ title: `Page: ${route.name}` })}
          />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
      profile: () => <Text testID="profile">Profile</Text>,
    });

    act(() => router.push('/profile'));

    expect(screen.getByTestId('profile')).toBeVisible();

    expect(MockedScreenStackItem.mock.calls[2][0].headerConfig?.title).toBe('Page: profile');
  });

  it('warns when function-form options are used in page context', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderRouter({
      index: () => (
        <>
          <Stack.Screen options={({ route }) => ({ title: `Page: ${route.name}` })} />
          <Text testID="index">Index</Text>
        </>
      ),
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Function-form options are not supported inside page components')
    );

    spy.mockRestore();
  });
});
