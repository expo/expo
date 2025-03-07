import React from 'react';
import { Text } from 'react-native';

import { Stack } from '../layouts/Stack';
import { screen, renderRouter } from '../testing-library';

it('can render a named layout', () => {
  renderRouter({
    index: () => <Text testID="test">Test</Text>,
    _layout_root: () => <Stack />,
  });

  expect(screen.getByTestId('test')).toBeTruthy();
});
