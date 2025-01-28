import React from 'react';
import { Text } from 'react-native';

import { Tabs } from '../layouts/Tabs';
import { renderRouter, screen } from '../testing-library';

it('should not render generated screens', () => {
  renderRouter({
    _layout: () => <Tabs />,
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  const tabList = screen.getByLabelText('index, tab, 1 of 3').parent;

  expect(tabList?.children).toHaveLength(1);
});

it('screens can be hidden', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="hidden" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    hidden: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  const tabList = screen.getByLabelText('index, tab, 2 of 4').parent;

  expect(tabList?.children).toHaveLength(1);
});
