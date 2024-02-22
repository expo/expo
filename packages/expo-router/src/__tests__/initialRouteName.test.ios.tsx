import React from 'react';
import { Text } from 'react-native';

import Stack from '../layouts/Stack';
import { act, renderRouter, screen } from '../testing-library';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';

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

it('works with useLocalSearchParams', async () => {
  // Issue #26908
  renderRouter(
    {
      '[fruit]/_layout': {
        unstable_settings: { initialRouteName: 'index' },
        default: () => <Stack />,
      },
      '[fruit]/index': function Index() {
        return <Text testID="first">{`${JSON.stringify(useLocalSearchParams())}`}</Text>;
      },
      '[fruit]/page': function Index() {
        return <Text testID="second">{`${JSON.stringify(useLocalSearchParams())}`}</Text>;
      },
    },
    {
      initialUrl: '/apple/page',
    }
  );

  expect(screen).toHavePathname('/apple/page');
  expect(screen).toHaveSearchParams({ fruit: 'apple' });
  expect(screen.getByTestId('second')).toHaveTextContent('{"fruit":"apple"}');

  act(() => router.back());

  expect(screen).toHavePathname('/apple');
  expect(screen).toHaveSearchParams({ fruit: 'apple' });
  expect(screen.getByTestId('first')).toHaveTextContent('{"fruit":"apple"}');
});
