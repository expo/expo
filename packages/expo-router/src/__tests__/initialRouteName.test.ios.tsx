import { screen, act, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { Link } from '../link/Link';
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

it('withAnchor does not add a param-less anchor for a nested stack with only a dynamic route', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': () => <Tabs />,
      '(tabs)/index': () => null,
      '(tabs)/social/_layout': () => (
        <Stack>
          <Stack.Screen name="index" />
          <Stack.Screen name="users" />
        </Stack>
      ),
      '(tabs)/social/index': () => (
        <Link testID="user-link" href="/social/users/1" withAnchor>
          User
        </Link>
      ),
      '(tabs)/social/users/_layout': () => (
        <Stack>
          <Stack.Screen name="[userId]" />
        </Stack>
      ),
      '(tabs)/social/users/[userId]': function User() {
        return <Text testID="user">{useLocalSearchParams().userId}</Text>;
      },
    },
    { initialUrl: '/social' }
  );

  fireEvent.press(screen.getByTestId('user-link'));

  expect(screen.getByTestId('user')).toHaveTextContent('1');

  act(() => router.back());

  expect(screen.getByTestId('user')).not.toHaveTextContent('1');
  expect(screen).toHavePathname('/social');
  expect(screen.getByTestId('user-link')).toBeVisible();
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

  // Initial stale state
  expect(store.state).toStrictEqual({
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

  act(() => router.push('/orange', { withAnchor: true }));

  expect(store.state).toStrictEqual({
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
              params: { initial: false, params: { initial: false }, screen: 'orange' },
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
                    params: { initial: false },
                  },
                ],
                stale: false,
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

it('push should ignore (group)/index as an initial route if no anchor is specified', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': {
      default: () => <Stack />,
    },
    '(group)/orange': () => null,
    '(group)/test': () => null,
  });

  // Initial stale state
  expect(store.state).toStrictEqual({
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

  act(() => router.push('/orange'));

  expect(store.state).toStrictEqual({
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
              params: { params: {}, screen: 'orange' },
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
                  },
                ],
                stale: false,
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
