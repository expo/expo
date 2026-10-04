import { act, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { navigationRef } from '../global-state/navigationRef';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter, testRouter } from '../testing-library';
import { Slot } from '../views/Navigator';

it('stacks should always push a new route', async () => {
  await renderRouter({
    index: () => null,
    '(group)/_layout': () => <Stack />,
    '(group)/user/[id]/_layout': () => <Stack />,
    '(group)/user/[id]/index': function User() {
      return <View testID={JSON.stringify(useLocalSearchParams())} />;
    },
    '(group)/post/[id]/_layout': () => <Stack />,
    '(group)/post/[id]/index': () => null,
  });

  // Initial complete state
  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', '(group)'],
          routes: [{ key: expect.any(String), name: 'index', path: '/' }],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });

  /**
   * Need to push separately so a new state is generated every time, otherwise they are batched
   * Every `push` event should create a new history frame
   */
  await act(() => router.push('/post/1'));
  await act(() => router.push('/user/1'));
  await act(() => router.push('/post/2'));
  await act(() => router.push('/user/1'));
  await act(() => router.push('/user/2'));

  expect(navigationRef.getRootState()).toStrictEqual({
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
          routeNames: ['index', '(group)'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '(group)',
              params: {
                id: '1',
              },
              path: undefined,
              state: {
                index: 3,
                key: expect.any(String),
                routeNames: ['user/[id]', 'post/[id]'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'post/[id]',
                    params: {
                      id: '1',
                    },
                    state: {
                      index: 0,
                      key: expect.any(String),
                      routeNames: ['index'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'index',
                          params: {
                            id: '1',
                          },
                          path: '/post/1',
                        },
                      ],
                      stale: false,
                      routeKeySeq: expect.any(Number),
                    },
                  },
                  {
                    key: expect.any(String),
                    name: 'user/[id]',
                    params: {
                      id: '1',
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
                          params: {
                            id: '1',
                          },
                          path: '/user/1',
                        },
                      ],
                      stale: false,
                      routeKeySeq: expect.any(Number),
                    },
                  },
                  {
                    key: expect.any(String),
                    name: 'post/[id]',
                    params: {
                      id: '2',
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
                          params: {
                            id: '2',
                          },
                          path: '/post/2',
                        },
                      ],
                      stale: false,
                      routeKeySeq: expect.any(Number),
                    },
                  },
                  {
                    key: expect.any(String),
                    name: 'user/[id]',
                    params: {
                      id: '1',
                    },
                    path: undefined,
                    state: {
                      index: 1,
                      key: expect.any(String),
                      routeNames: ['index'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'index',
                          params: {
                            id: '1',
                          },
                          path: '/user/1',
                        },
                        {
                          key: expect.any(String),
                          name: 'index',
                          params: {
                            id: '2',
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
    type: 'stack',
  });
});

it('can push & replace with nested Slots', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text testID="index" />,
    'one/_layout': () => <Slot />,
    'one/index': () => <Text testID="one" />,
  });

  await act(() => router.push('/one'));
  expect(screen).toHavePathname('/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  // Correctly targets the `root` slot (sets target: <root layout key>)
  await act(() => router.push('/'));
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();
});

it('should navigate as expected when nested Stacks & Tabs', async () => {
  await renderRouter({
    index: () => <Text testID="index" />,
    'apple/_layout': () => <Stack />,
    'apple/index': () => <Text testID="apple" />,
    'apple/[type]/_layout': () => (
      <Tabs>
        <Tabs.Screen name="color" />
        <Tabs.Screen name="taste" />
      </Tabs>
    ),
    'apple/[type]/color': () => <Text testID="color" />,
    'apple/[type]/taste': () => <Text testID="taste" />,
  });

  await act(() => router.push('/apple')); // Push to the root Stack
  expect(screen).toHavePathname('/apple');
  expect(screen.getByTestId('apple')).toBeOnTheScreen();

  await act(() => router.push('/apple/1/color')); // Push to the apple/layout
  expect(screen).toHavePathname('/apple/1/color');

  await act(() => router.push('/apple/1/taste')); // Tabs don't push, so this doesn't affect the history
  expect(screen).toHavePathname('/apple/1/taste');

  await act(() => router.push('/apple/2/taste')); // [type] is outside of the tabs, so it pushed to apple/_layout
  expect(screen).toHavePathname('/apple/2/taste');

  await act(() => router.push('/apple/2/color')); // Tabs don't push, so this doesn't affect the history
  expect(screen).toHavePathname('/apple/2/color');

  await act(() => router.back());
  expect(screen).toHavePathname('/apple/1/taste');

  await act(() => router.back());
  expect(screen).toHavePathname('/apple/1/color');

  await act(() => router.back());
  expect(screen).toHavePathname('/apple');
});

it('works in a nested layout Stack->Tab->Stack', async () => {
  await renderRouter({
    index: () => null,
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="a" />
        <Tabs.Screen name="b" />
        <Tabs.Screen name="c" />
      </Tabs>
    ),
    '(tabs)/a': () => <Text testID="a" />,
    '(tabs)/b': () => <Text testID="b" />,
    '(tabs)/c/_layout': () => <Stack />,
    '(tabs)/c/one': () => <Text testID="c/one" />,
    '(tabs)/c/two': () => <Text testID="c/two" />,
    d: () => null,
  });

  await testRouter.push('/a');
  expect(screen.getByTestId('a')).toBeOnTheScreen();
  await testRouter.push('/b');
  expect(screen.getByTestId('b')).toBeOnTheScreen();
  await testRouter.push('/c/one');
  expect(screen.getByTestId('c/one')).toBeOnTheScreen();
  await testRouter.push('/c/two');
  expect(screen.getByTestId('c/two')).toBeOnTheScreen();
  await testRouter.push('/c/two');
  expect(screen.getByTestId('c/two')).toBeOnTheScreen();

  await testRouter.push('/d');

  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 2,
          key: expect.any(String),
          routeNames: ['index', '(tabs)', 'd'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '(tabs)',
              params: {},
              path: undefined,
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
                routeNames: ['a', 'b', 'c'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                    path: '/a',
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
                    state: {
                      index: 2,
                      key: expect.any(String),
                      routeNames: ['one', 'two'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'one',
                          params: {},
                          path: '/c/one',
                        },
                        {
                          key: expect.any(String),
                          name: 'two',
                          params: {},
                          path: undefined,
                        },
                        {
                          key: expect.any(String),
                          name: 'two',
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
                type: 'tab',
              },
            },
            {
              key: expect.any(String),
              name: 'd',
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
  });
});

it('targets the correct Stack when pushing to a nested layout', async () => {
  await renderRouter(
    {
      _layout: () => <Stack />,
      a: () => null,
      b: () => null,
      'one/_layout': () => <Stack />,
      'one/index': () => <View testID="one" />,
      'one/page': () => <View testID="one/page" />,
      'one/two/_layout': () => <Stack />,
      'one/two/index': () => <View testID="one/two" />,
      'one/two/page': () => <View testID="one/two/page" />,
    },
    {
      initialUrl: '/a',
    }
  );

  await act(() => router.push('/b')); // Should be at index 1 on the root stack

  await act(() => router.push('/one')); // Should be at index 2 on the root stack
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  await act(() => router.push('/one/page')); // Should be at index 1, nested inside index 2 on the root stack
  expect(screen.getByTestId('one/page')).toBeOnTheScreen();

  await act(() => router.push('/one/two')); // Should be at index 2, nested inside index 2 on the root stack
  expect(screen.getByTestId('one/two')).toBeOnTheScreen();

  await act(() => router.push('/one/two/page')); // Should be at index 1, nested inside index 2, inside index 2 on the root stack
  expect(screen.getByTestId('one/two/page')).toBeOnTheScreen();

  await act(() => router.push('/a')); // Should push to the root stack

  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 3,
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
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'one',
              params: {},
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
                    name: 'two',
                    params: {},
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
                          path: '/one/two',
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
            {
              key: expect.any(String),
              name: 'a',
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
  });
});

it('push should also add anchor routes', async () => {
  await renderRouter({
    index: () => null,
    '(group)/_layout': {
      default: () => <Stack />,
      unstable_settings: {
        anchor: 'apple',
      },
    },
    '(group)/index': () => null,
    '(group)/apple': () => null,
    '(group)/orange': () => null,
  });

  // Initial complete state
  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', '(group)'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
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

  await act(() => router.push('/orange', { withAnchor: true }));

  expect(navigationRef.getRootState()).toStrictEqual({
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
          routeNames: ['index', '(group)'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '(group)',
              params: {},
              path: undefined,
              state: {
                index: 1,
                key: expect.any(String),
                routeNames: ['apple', 'index', 'orange'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'apple',
                  },
                  {
                    key: expect.any(String),
                    name: 'orange',
                    params: {},
                    path: '/orange',
                  },
                ],
                stale: false,
                routeKeySeq: expect.any(Number),
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
    type: 'stack',
  });
});

describe('singular', () => {
  test('can dynamically route using singular', async () => {
    await renderRouter(
      {
        '[slug]': () => null,
      },
      {
        initialUrl: '/apple',
      }
    );

    await act(() => router.push('/apple'));
    await act(() => router.push('/apple'));
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
            index: 3,
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
                  slug: 'apple',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: undefined,
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

    // Should push /apple and remove all previous instances of /apple
    await act(() => router.push('/apple', { dangerouslySingular: true }));

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
  });

  test('can dynamically route using singular function', async () => {
    await renderRouter(
      {
        '[slug]': () => null,
      },
      {
        initialUrl: '/apple',
      }
    );

    await act(() => router.push('/apple?id=1'));
    await act(() => router.push('/apple?id=1'));
    await act(() => router.push('/apple?id=2'));
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
            index: 4,
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
                  id: '1',
                  slug: 'apple',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  id: '1',
                  slug: 'apple',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  id: '2',
                  slug: 'apple',
                },
                path: undefined,
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

    // Should push /apple and remove all previous instances of /apple
    await act(() => {
      return router.push('/apple', {
        dangerouslySingular: (_, params) => params.slug?.toString(),
      });
    });

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
  });
});
