/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationContext } from '../../core';
import { DefaultTheme, ThemeProvider } from '../../native';
import { Header } from '../Header/Header';
import { FrameSizeProvider } from '../useFrameSize';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

const navigation = { addListener: () => () => {} } as any;

function renderHeader(
  headerSearchBarOptions: React.ComponentProps<typeof Header>['headerSearchBarOptions']
) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 400, height: 800 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}>
      <ThemeProvider value={DefaultTheme}>
        <NavigationContext value={navigation}>
          <FrameSizeProvider
            initialFrame={{ width: 400, height: 800 }}
            render={() => <Header title="Test" headerSearchBarOptions={headerSearchBarOptions} />}
          />
        </NavigationContext>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

describe('header search buttons', () => {
  it('labels the open button', () => {
    renderHeader({});
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('labels the close button, then the clear button once text is typed', () => {
    renderHeader({});
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'abc' } });
    expect(screen.getByRole('button', { name: 'Clear text' })).toBeTruthy();
  });

  it('uses custom labels', () => {
    renderHeader({
      openButtonAccessibilityLabel: 'Open',
      cancelButtonAccessibilityLabel: 'Dismiss',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });
});
