import { act, screen } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';
import { Text } from 'react-native';

import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import type { StackScreenProps } from '../layouts/stack-utils';
import { renderRouter, testRouter } from '../testing-library';
import type { ScreenProps } from '../useScreens';
import { expectCompleteStateToMatch } from './assertCompleteState';

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
  it('works with fresh stack state', async () => {
    await renderRouter({ index: () => null, b: () => null });

    expect(router.canDismiss()).toBe(false);
    await act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(true);
  });

  // TODO(ENG-22019): Detect typeless stacks created by the default Stack.
  it.skip('should work within the default Stack', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    await act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(true);
  });

  it('should always return false while not within a stack', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="a" />
            <Tabs.Screen name="b" />
          </Tabs>
        ),
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    await act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(false);
  });

  it('does not treat an anchored tab state as a stack', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { initialRouteName: 'a' },
          default: () => (
            <Tabs>
              <Tabs.Screen name="a" />
              <Tabs.Screen name="b" />
            </Tabs>
          ),
        },
        a: () => null,
        b: () => null,
      },
      { initialUrl: '/b' }
    );

    expect(router.canDismiss()).toBe(false);
  });
});

test('dismiss', async () => {
  await renderRouter(
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

  await act(() => router.push('/b'));
  await act(() => router.push('/c'));
  await act(() => router.push('/d'));

  expect(screen).toHavePathname('/d');

  await act(() => router.dismiss());
  expect(screen).toHavePathname('/c');

  await act(() => router.dismiss(2));
  expect(screen).toHavePathname('/a');
});

test('dismissAll', async () => {
  await renderRouter(
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

  await act(() => router.push('/b'));
  await act(() => router.push('/c'));
  await act(() => router.push('/d'));

  expect(screen).toHavePathname('/d');

  await act(() => router.dismissAll());
  expect(screen).toHavePathname('/a');
  expect(router.canDismiss()).toBe(false);
});

test('dismissAll nested', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="a" />
          <Tabs.Screen name="b" />
          <Tabs.Screen name="one" />
        </Tabs>
      ),
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

  await testRouter.push('/b');

  await testRouter.push('/one');
  await testRouter.push('/one/page');
  await testRouter.push('/one/page');

  await testRouter.push('/one/two');
  await testRouter.push('/one/two/page');
  await testRouter.push('/one/two/page');

  // We should have three top level routes (/a, /b, /one)
  // The last route should include a sub-state for /one/_layout
  // It will have three routes  (/one/index, /one/page, /one/two)
  // The last route should include a sub-state for /one/two/_layout
  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
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
          routeNames: ['a', 'b', 'one'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              path: '/a',
            },
            {
              key: expect.any(String),
              name: 'b',
              params: {},
            },
            {
              key: expect.any(String),
              name: 'one',
              params: {},
              state: {
                index: 3,
                key: expect.any(String),
                routeNames: ['index', 'two', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                    path: '/one',
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
                    params: {},
                    path: undefined,
                    state: {
                      index: 2,
                      key: expect.any(String),
                      routeNames: ['index', 'page'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'index',
                          params: {},
                          path: '/one/two',
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
                      routeKeySeq: expect.any(Number),
                      type: 'stack',
                    },
                  },
                ],
                stale: false,
                routeKeySeq: expect.any(Number),
                type: 'stack',
              },
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
          type: 'tab',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });

  // This should only dismissing the sub-state for /one/two/_layout
  await testRouter.dismissAll();
  expect(screen).toHavePathname('/one/two');
  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
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
          routeNames: ['a', 'b', 'one'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              path: '/a',
            },
            {
              key: expect.any(String),
              name: 'b',
              params: {},
            },
            {
              key: expect.any(String),
              name: 'one',
              params: {},
              state: {
                index: 3,
                key: expect.any(String),
                routeNames: ['index', 'two', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                    path: '/one',
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
                    params: {},
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
                          path: '/one/two',
                        },
                      ],
                      stale: false,
                      routeKeySeq: expect.any(Number),
                      type: 'stack',
                    },
                  },
                ],
                stale: false,
                routeKeySeq: expect.any(Number),
                type: 'stack',
              },
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
          type: 'tab',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });

  // This should only dismissing the sub-state for /one/_layout
  await testRouter.dismissAll();
  expect(screen).toHavePathname('/one');
  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
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
          routeNames: ['a', 'b', 'one'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              path: '/a',
            },
            {
              key: expect.any(String),
              name: 'b',
              params: {},
            },
            {
              key: expect.any(String),
              name: 'one',
              params: {},
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['index', 'two', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                    path: '/one',
                  },
                ],
                stale: false,
                routeKeySeq: expect.any(Number),
                type: 'stack',
              },
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
          type: 'tab',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });

  // Cannot dismiss again as we are at the root Tabs layout
  expect(router.canDismiss()).toBe(false);
});

test('pushing in a nested stack should only rerender the nested stack', async () => {
  const RootLayout = jest.fn(() => <Stack />);
  const NestedLayout = jest.fn(() => <Stack />);
  const NestedNestedLayout = jest.fn(() => <Stack />);

  await renderRouter(
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

  await testRouter.push('/one/b');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(1);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(0);

  await testRouter.push('/one/two/a');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(1);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(1);
});

test('can preserve the nested initialRouteName when navigating to a nested stack', async () => {
  await renderRouter({
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

  await act(() => router.push('/fruit/banana', { withAnchor: true }));
  expect(screen.getByTestId('banana')).toBeDefined();
  await act(() => router.back());
  expect(screen.getByTestId('apple')).toBeDefined();
  await act(() => router.back());
  expect(screen.getByTestId('link')).toBeDefined();
});

test('push should cascade anchor routes through multiple nested stacks', async () => {
  await renderRouter({
    index: () => <Text testID="a">A</Text>,
    'funnel/_layout': {
      unstable_settings: { anchor: 'ba' },
      default: () => <Stack />,
    },
    'funnel/ba': () => <Text testID="ba">BA</Text>,
    'funnel/bb/_layout': {
      unstable_settings: { anchor: 'index' },
      default: () => <Stack />,
    },
    'funnel/bb/index': () => <Text testID="bb">BB</Text>,
    'funnel/bb/bc': () => <Text testID="bc">BC</Text>,
  });

  await act(() => router.push('/funnel/bb/bc', { withAnchor: true }));

  expect(screen).toHavePathname('/funnel/bb/bc');
  expect(screen.getByTestId('bc')).toBeVisible();

  await act(() => router.back());
  expect(screen).toHavePathname('/funnel/bb');
  expect(screen.getByTestId('bb')).toBeVisible();

  await act(() => router.back());
  expect(screen).toHavePathname('/funnel/ba');
  expect(screen.getByTestId('ba')).toBeVisible();

  await act(() => router.back());
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('a')).toBeVisible();
});

// TODO: SDK 57 already had this issue. It has little user-facing impact because the visible
// navigation and back behavior are unchanged. Revisit whether matching sequential state is
// feasible and worth the added complexity.
test.skip('three pushes queued in one tick build the same stack as three separate pushes', async () => {
  const routes = {
    index: () => <Text testID="a">A</Text>,
    'funnel/_layout': {
      unstable_settings: { anchor: 'ba' },
      default: () => <Stack />,
    },
    'funnel/ba': () => <Text testID="ba">BA</Text>,
    'funnel/bb/_layout': {
      unstable_settings: { anchor: 'index' },
      default: () => <Stack />,
    },
    'funnel/bb/index': () => <Text testID="bb">BB</Text>,
    'funnel/bb/bc': () => <Text testID="bc">BC</Text>,
  };

  await renderRouter(routes);

  // Keep these pushes in one callback so the routing queue drains them as one batch.
  await act(() => {
    router.push('/funnel/ba');
    router.push('/funnel/bb');
    router.push('/funnel/bb/bc');
  });

  const batchedState = structuredClone(navigationRef.getRootState());

  await screen.unmount();
  await renderRouter(routes);

  await act(() => router.push('/funnel/ba'));
  await act(() => router.push('/funnel/bb'));
  await act(() => router.push('/funnel/bb/bc'));

  expect(batchedState).toStrictEqual(navigationRef.getRootState());
});

describe('presentation validation', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('throws when an invalid presentation is set via screen options', async () => {
    await expect(async () => {
      await renderRouter({
        _layout: () => <Stack screenOptions={{ presentation: 'xyz' as any }} />,
        index: () => <Text>Index</Text>,
      });
    }).rejects.toThrow('Invalid presentation value "xyz"');
  });

  it('throws when an invalid presentation is set via layout options', async () => {
    await expect(async () => {
      await renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" options={{ presentation: 'xyz' as any }} />
          </Stack>
        ),
        index: () => <Text>Index</Text>,
      });
    }).rejects.toThrow('Invalid presentation value "xyz"');
  });

  it('throws when an invalid presentation is set via page-level Stack.Screen', async () => {
    await expect(async () => {
      await renderRouter({
        index: () => (
          <>
            <Stack.Screen options={{ presentation: 'xyz' as any }} />
            <Text>Index</Text>
          </>
        ),
      });
    }).rejects.toThrow('Invalid presentation value "xyz"');
  });
});

describe('singular', () => {
  test('singular should only allow one instance of a screen', async () => {
    await renderRouter(
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

    expectCompleteStateToMatch(navigationRef.getRootState(), {
      index: 0,
      key: expect.any(String),
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
            routeKeySeq: expect.any(Number),
          },
        },
      ],
      stale: false,
      routeKeySeq: expect.any(Number),
    });

    // Normally pushing would add a new route, but since we have singular set to true
    // Nothing should happen, as the current route is already the same as the target route
    await act(() => router.push('/apple'));
    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
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
            routeKeySeq: expect.any(Number),
            type: 'stack',
          },
        },
      ],
      stale: false,
      routeKeySeq: expect.any(Number),
      type: 'stack',
    });

    // Adding a new screen with different params should work
    await act(() => router.push('/banana'));
    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
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
            routeKeySeq: expect.any(Number),
            type: 'stack',
          },
        },
      ],
      stale: false,
      routeKeySeq: expect.any(Number),
      type: 'stack',
    });

    // Normally pushing would add a new route, but since we have singular set to true
    // It rearranges the Stack to move /apple to the current route
    await act(() => router.push('/apple'));
    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
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
            routeKeySeq: expect.any(Number),
            type: 'stack',
          },
        },
      ],
      stale: false,
      routeKeySeq: expect.any(Number),
      type: 'stack',
    });
  });
});

describe('Stack.Screen types', () => {
  it('accepts layout navigation props', () => {
    expectTypeOf<ScreenProps>().not.toHaveProperty('redirect');
    expectTypeOf<StackScreenProps>().not.toHaveProperty('redirect');
    expectTypeOf<ScreenProps>().not.toHaveProperty('initialParams');
    expectTypeOf<StackScreenProps>().not.toHaveProperty('initialParams');
    expectTypeOf({ name: 'settings', dangerouslySingular: true }).toExtend<StackScreenProps>();
    expectTypeOf({
      name: 'details',
      dangerouslySingular: (name, params) => `${name}-${params.id}`,
    } satisfies StackScreenProps).toExtend<StackScreenProps>();
    expectTypeOf({
      name: 'page',
      listeners: { transitionStart: () => {} },
    }).toExtend<StackScreenProps>();
    expectTypeOf({
      name: 'page',
      listeners: ({ route, navigation }) => ({ focus: () => {} }),
    } satisfies StackScreenProps).toExtend<StackScreenProps>();
    expectTypeOf({
      name: 'page',
      getId: ({ params }) => params?.id,
    } satisfies StackScreenProps).toExtend<StackScreenProps>();
  });

  it('accepts function-form options', () => {
    expectTypeOf({
      options: ({ route }) => ({ title: (route.params as Record<string, string>)?.name }),
    } satisfies StackScreenProps).toExtend<StackScreenProps>();
    expectTypeOf({
      name: 'profile',
      options: ({ route, navigation }) => ({
        title: `Profile: ${(route.params as Record<string, string>)?.id}`,
      }),
    } satisfies StackScreenProps).toExtend<StackScreenProps>();
  });
});

it('does not deregister screens when passed the removed redirect prop', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Screen name="a" {...({ redirect: true } as Record<string, unknown>)} />
        </Stack>
      ),
      a: () => <Text testID="a">A</Text>,
      b: () => <Text>B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(screen.getByTestId('a')).toBeVisible();
});

describe('function-form options', () => {
  beforeEach(() => {
    MockedScreenStackItem.mockClear();
  });

  it('passes resolved function-form options to ScreenStackItem', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={({ route }) => ({ title: `Page: ${route.name}` })} />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(MockedScreenStackItem.mock.calls[0]![0].headerConfig?.title).toBe('Page: index');
  });

  it('calls function-form options with route and navigation', async () => {
    const optionsFn = jest.fn(({ route }) => ({ title: `Page: ${route.name}` }));

    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={optionsFn} />
        </Stack>
      ),
      index: () => <Text testID="index">Index</Text>,
    });

    expect(optionsFn).toHaveBeenCalled();
    const arg = optionsFn.mock.calls[0]![0];
    expect(arg).toHaveProperty('route');
    expect(arg).toHaveProperty('navigation');
    expect(arg.route).toHaveProperty('name', 'index');
  });

  it('passes updated options to ScreenStackItem after navigation', async () => {
    await renderRouter({
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

    await act(() => router.push('/profile'));

    expect(screen.getByTestId('profile')).toBeVisible();

    expect(MockedScreenStackItem.mock.calls[2]![0].headerConfig?.title).toBe('Page: profile');
  });

  it('warns when function-form options are used in page context', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderRouter({
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

describe('Screen options with /index suffix normalization', () => {
  it('should apply Screen options when name omits /index suffix', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderRouter(
      {
        _layout: () => (
          <Stack id={undefined}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings/general" options={{ title: 'General Settings' }} />
          </Stack>
        ),
        index: () => <Text testID="index">Index</Text>,
        'settings/general/index': () => <Text testID="settings">Settings</Text>,
      },
      { initialUrl: '/settings/general' }
    );

    expect(screen.getByTestId('settings')).toBeVisible();
    expect(screen).toHavePathname('/settings/general');

    // Verify the title option is actually applied
    expect(MockedScreenStackItem.mock.calls[0]![0].headerConfig?.title).toBe('General Settings');

    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining('[Layout children]'),
      expect.anything()
    );

    spy.mockRestore();
  });

  it('should apply options when _layout exists alongside index', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderRouter(
      {
        _layout: () => (
          <Stack id={undefined}>
            <Stack.Screen name="index" />
            <Stack.Screen name="otp/[flow]" options={{ title: 'OTP Flow' }} />
          </Stack>
        ),
        index: () => <Text testID="index">Index</Text>,
        'otp/[flow]/_layout': () => <Stack />,
        'otp/[flow]/index': () => <Text testID="otp">OTP</Text>,
      },
      { initialUrl: '/otp/signin' }
    );

    expect(screen.getByTestId('otp')).toBeVisible();
    expect(screen).toHavePathname('/otp/signin');

    // Verify the title option is actually applied
    expect(MockedScreenStackItem.mock.calls[0]![0].headerConfig?.title).toBe('OTP Flow');

    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining('[Layout children]'),
      expect.anything()
    );

    spy.mockRestore();
  });

  it('should apply options when _layout exists without index', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderRouter(
      {
        _layout: () => (
          <Stack id={undefined}>
            <Stack.Screen name="index" />
            <Stack.Screen name="otp/[flow]" options={{ title: 'OTP Flow' }} />
          </Stack>
        ),
        index: () => <Text testID="index">Index</Text>,
        'otp/[flow]/_layout': () => <Stack />,
        'otp/[flow]/step1': () => <Text testID="step1">Step 1</Text>,
      },
      { initialUrl: '/otp/signin/step1' }
    );

    expect(screen.getByTestId('step1')).toBeVisible();
    expect(screen).toHavePathname('/otp/signin/step1');

    // Verify the title option is actually applied
    expect(MockedScreenStackItem.mock.calls[0]![0].headerConfig?.title).toBe('OTP Flow');

    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining('[Layout children]'),
      expect.anything()
    );

    spy.mockRestore();
  });

  it('should throw when both name="otp/[flow]" and name="otp/[flow]/index" are used', async () => {
    await expect(
      async () =>
        await renderRouter(
          {
            _layout: () => (
              <Stack id={undefined}>
                <Stack.Screen name="index" />
                <Stack.Screen name="otp/[flow]" options={{ title: 'OTP Short' }} />
                <Stack.Screen name="otp/[flow]/index" options={{ title: 'OTP Full' }} />
              </Stack>
            ),
            index: () => <Text testID="index">Index</Text>,
            'otp/[flow]/index': () => <Text testID="otp">OTP</Text>,
          },
          { initialUrl: '/otp/signin' }
        )
    ).rejects.toThrow('Screen names must be unique');
  });
});
