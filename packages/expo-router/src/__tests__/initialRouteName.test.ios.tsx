import React from 'react';
import { Text } from 'react-native';

import Stack from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';

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
