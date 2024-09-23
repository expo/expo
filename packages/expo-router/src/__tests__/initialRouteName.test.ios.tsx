import React from 'react';
import { Text } from 'react-native';

import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { act, renderRouter, screen } from '../testing-library';
import { store } from '../global-state/router-store';

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

it('push should ignore (group)/index as an initial route if not specified', () => {
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
  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  act(() => router.push('/orange'));

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 1,
    key: expect.any(String),
    routeNames: ['index', '(group)', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          initial: false,
          params: {
            initial: false,
          },
          screen: 'orange',
        },
        path: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['test', 'orange'],
          routes: [
            {
              key: expect.any(String),
              name: 'test',
              params: undefined,
            },
            {
              key: expect.any(String),
              name: 'orange',
              params: {
                initial: false,
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
  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  act(() => router.push('/orange'));

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 1,
    key: expect.any(String),
    routeNames: ['index', '(group)', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          params: {},
          screen: 'orange',
        },
        path: undefined,
      },
    ],
    stale: false,
    type: 'stack',
  });
});
