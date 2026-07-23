/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import { View } from 'react-native';

import { ExpoRoot } from '../../ExpoRoot';
import { store } from '../../global-state/router-store';
import { router } from '../../imperative-api';
import type { NativeStackHeaderProps } from '../../react-navigation/native-stack';
import { getMockContext } from '../../testing-library/mock-config';
import Stack from '../StackClient';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

describe('StackClient on web', () => {
  it('renders, pushes, goes back, and provides the header back href', () => {
    let backHref: string | undefined;

    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    const context = getMockContext({
      _layout: () => (
        <Stack>
          <Stack.Screen
            name="second"
            options={{
              header: ({ back }: NativeStackHeaderProps) => {
                backHref = back?.href;
                return null;
              },
            }}
          />
        </Stack>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });
    render(<ExpoRoot context={context} location="/" />);

    expect(screen.getByTestId('index')).toBeTruthy();

    act(() => router.push('/second'));
    expect(screen.getByTestId('second')).toBeTruthy();
    expect(store.getRouteInfo().pathname).toBe('/second');
    expect(backHref).toBe('/');

    act(() => router.back());
    expect(screen.getByTestId('index')).toBeTruthy();
    expect(store.getRouteInfo().pathname).toBe('/');
  });
});
