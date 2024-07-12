import React from 'react';
import { Text } from 'react-native';

import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { act, renderRouter, screen } from '../testing-library';

/**
 * initialRouteName sets the "default" screen for a navigator, with the functionality changing per navigator
 */

it('will default to the initialRouteName', async () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName: 'apple' },
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

it('initialURL overrides initialRouteName', async () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName: 'index' },
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

it.only('render the initial route with local params', async () => {
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
