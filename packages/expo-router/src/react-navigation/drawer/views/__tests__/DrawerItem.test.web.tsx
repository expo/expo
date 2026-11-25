/** @jest-environment jsdom */
import { render } from '@testing-library/react';

import { DefaultTheme, ThemeProvider } from '../../../native';
import { DrawerItem } from '../DrawerItem';

it('marks the focused drawer link with aria-current', () => {
  const { getByTestId, rerender } = render(
    <ThemeProvider value={DefaultTheme}>
      <DrawerItem label="Home" href="/home" focused onPress={() => {}} testID="item" />
    </ThemeProvider>
  );

  expect(getByTestId('item').getAttribute('aria-current')).toBe('page');
  expect(getByTestId('item').hasAttribute('aria-selected')).toBe(false);

  rerender(
    <ThemeProvider value={DefaultTheme}>
      <DrawerItem label="Home" href="/home" focused={false} onPress={() => {}} testID="item" />
    </ThemeProvider>
  );

  expect(getByTestId('item').hasAttribute('aria-current')).toBe(false);
  expect(getByTestId('item').hasAttribute('aria-selected')).toBe(false);
});
