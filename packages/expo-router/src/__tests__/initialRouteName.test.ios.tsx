import { screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { navigationRef } from '../global-state/navigationRef';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

/**
 * anchor sets the "default" screen for a navigator, with the functionality changing per navigator
 */

it('will default to the anchor', async () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'apple' },
        default: () => <Stack />,
      },
      index: function Index() {
        return <Text>index</Text>;
      },
      apple: () => <Text>apple</Text>,
    },
    {
      initialUrl: '/apple',
    }
  );

  expect(screen).toHavePathname('/apple');
});

it('initialURL overrides anchor', async () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'index' },
        default: () => <Stack />,
      },
      index: function Index() {
        return <Text>index</Text>;
      },
      apple: () => <Text>apple</Text>,
    },
    {
      initialUrl: '/apple',
    }
  );

  expect(screen).toHavePathname('/apple');
});

it('render the initial route with local params', async () => {
  // Issue #26908
  // Expo Router matches the behavior of React Navigation, but this behavior is slightly not correct
  // In this example, the initialRoute should not have 'id' as a param, but React Navigation passes the same params
  // To both the initialRoute and the route that is focused.
  // To fix this, we would need update getStateFromPath so that the initialRoute is loaded with its own params
  renderRouter(
    {
      index: () => null,
      '[fruit]/_layout': {
        unstable_settings: { initialRouteName: 'index' },
        default: () => <Stack />,
      },
      '[fruit]/index': function Index() {
        return <Text testID="first">{`${JSON.stringify(useLocalSearchParams())}`}</Text>;
      },
      '[fruit]/[id]': function Index() {
        return <Text testID="second">{`${JSON.stringify(useLocalSearchParams())}`}</Text>;
      },
    },
    {
      initialUrl: '/apple/1',
    }
  );

  expect(screen).toHavePathname('/apple/1');
  expect(screen).toHaveSearchParams({ fruit: 'apple', id: '1' });
  expect(screen.getByTestId('second')).toHaveTextContent('{"fruit":"apple","id":"1"}');

  act(() => router.back());

  expect(screen).toHavePathname('/apple');
  expect(screen).toHaveSearchParams({ fruit: 'apple', id: '1' });
  expect(screen.getByTestId('first')).toHaveTextContent('{"fruit":"apple","id":"1"}');
});

it('push should include (group)/index as an anchor route when using withAnchor', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': {
      unstable_settings: {
        anchor: 'test',
      },
      default: () => <Stack />,
    },
    '(group)/orange': () => null,
    '(group)/test': () => null,
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

  act(() => router.push('/orange', { withAnchor: true }));

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
                routeNames: ['test', 'orange'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'test',
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

it('push should ignore (group)/index as an initial route if no anchor is specified', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': {
      default: () => <Stack />,
    },
    '(group)/orange': () => null,
    '(group)/test': () => null,
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

  act(() => router.push('/orange'));

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
                index: 0,
                key: expect.any(String),
                routeNames: ['test', 'orange'],
                routes: [
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

describe('async routes', () => {
  const routes = {
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="anchored" />
      </Tabs>
    ),
    '(tabs)/index': () => <Text>home</Text>,
    '(tabs)/anchored/_layout': {
      unstable_settings: { anchor: 'index' },
      default: () => <Stack />,
    },
    '(tabs)/anchored/index': () => <Text>anchored</Text>,
    '(tabs)/anchored/details': () => <Text>details</Text>,
  };

  afterEach(() => {
    delete globalThis.__EXPO_ROUTER_LAYOUT_SETTINGS__;
  });

  it('seeds the anchor below a deep-linked screen from the server-rendered settings', () => {
    // With async routes the route tree is built before any layout module has loaded, so the
    // server render inlines the anchor settings into the HTML.
    globalThis.__EXPO_ROUTER_LAYOUT_SETTINGS__ = {
      './(tabs)/anchored/_layout.js': { anchor: 'index' },
    };

    renderRouter(routes, { initialUrl: '/anchored/details', importMode: 'lazy' });

    expect(navigationRef.getRootState()).toMatchObject({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: '(tabs)',
                state: {
                  routes: [
                    {
                      name: 'anchored',
                      state: {
                        index: 1,
                        routes: [{ name: 'index' }, { name: 'details' }],
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
  });

  it('has no anchor below a deep-linked screen without the server-rendered settings', () => {
    renderRouter(routes, { initialUrl: '/anchored/details', importMode: 'lazy' });

    expect(navigationRef.getRootState()).toMatchObject({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: '(tabs)',
                state: {
                  routes: [
                    { name: 'anchored', state: { index: 0, routes: [{ name: 'details' }] } },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });
});
