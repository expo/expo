import { TabRouter, TabRouterOptions } from '@react-navigation/native';
import React from 'react';
import { Text } from 'react-native';

import { Navigator, Slot } from '../index';
import { screen, renderRouter } from '../testing-library';

it('can render a custom navigator', () => {
  // The default <Stack /> doesn't have any routerOptions, so we use TabRouter
  // to check that the routerOption types are correct
  const customRouter = jest.fn((options: TabRouterOptions) => {
    return TabRouter(options);
  });

  renderRouter({
    '(app)/_layout': {
      unstable_settings: {
        initialRouteName: 'two',
      },
      default: () => (
        <Navigator router={customRouter} routerOptions={{ backBehavior: 'history' }}>
          <Slot />
        </Navigator>
      ),
    },
    '(app)/index': () => <Text testID="index">Hello, world</Text>,
    '(app)/two': () => <Text testID="two" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(customRouter).toHaveBeenCalledWith({
    id: '/(app)',
    backBehavior: 'history',
    initialRouteName: undefined,
  });
});
