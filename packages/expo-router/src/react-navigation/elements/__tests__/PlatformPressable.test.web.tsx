/** @jest-environment jsdom */
import { render } from '@testing-library/react';
import { Text } from 'react-native';

import { DefaultTheme, ThemeProvider } from '../../native';
import { PlatformPressable } from '../PlatformPressable';

it('exposes the disabled state', () => {
  const { getByTestId } = render(
    <ThemeProvider value={DefaultTheme}>
      <PlatformPressable disabled testID="pressable">
        <Text>Action</Text>
      </PlatformPressable>
    </ThemeProvider>
  );

  expect(getByTestId('pressable').getAttribute('aria-disabled')).toBe('true');
});
