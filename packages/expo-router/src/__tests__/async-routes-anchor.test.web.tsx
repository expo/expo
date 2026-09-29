/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { navigationRef } from '../global-state/navigationRef';
import Stack from '../layouts/StackClient';
import Tabs from '../layouts/Tabs';
import type { NavigationState, PartialState } from '../react-navigation/routers';
import { createLazyContext } from './lazyContext';

// The router reads the import mode from this module. Babel inlines the `EXPO_ROUTER_IMPORT_MODE`
// environment variable as `sync` in tests, so the environment variable cannot switch it.
jest.mock('../import-mode', () => ({ __esModule: true, default: 'lazy' }));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

const routes = {
  './_layout.tsx': { default: () => <Stack /> },
  './(tabs)/_layout.tsx': {
    default: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="anchored" />
      </Tabs>
    ),
  },
  './(tabs)/index.tsx': { default: () => <Text testID="home">home</Text> },
  './(tabs)/anchored/_layout.tsx': {
    default: () => <Stack />,
    unstable_settings: { anchor: 'index' },
  },
  './(tabs)/anchored/index.tsx': { default: () => <Text testID="anchored">anchored</Text> },
  './(tabs)/anchored/details.tsx': {
    default: () => <Text testID="details">details</Text>,
  },
};

type State = NavigationState | PartialState<NavigationState>;

function findState(state: State | undefined, routeName: string): State | undefined {
  if (!state) {
    return undefined;
  }
  for (const route of state.routes) {
    if (route.name === routeName) {
      return route.state;
    }
    const found = findState(route.state, routeName);
    if (found) {
      return found;
    }
  }
  return undefined;
}

describe('anchors with async routes', () => {
  for (const alwaysAsync of [false, true]) {
    it(`seeds the anchor below a deep-linked screen (alwaysAsync: ${alwaysAsync})`, async () => {
      const lazy = createLazyContext(routes, { alwaysAsync });

      // The root suspends, so the render must be awaited.
      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(<ExpoRoot context={lazy.context} location="/anchored/details" />);
      });
      try {
        // The router waits for the layouts on the URL before it seeds the navigation state.
        expect(screen.queryByTestId('details')).toBeNull();
        expect(lazy.isLoaded('./(tabs)/anchored/_layout.tsx')).toBe(false);

        await act(async () => {
          await lazy.load();
        });

        expect(await screen.findByTestId('details')).toBeTruthy();

        const anchored = findState(navigationRef.getRootState(), 'anchored');
        expect(anchored?.routes.map((route) => route.name)).toEqual(['index', 'details']);
        expect(anchored?.index).toBe(1);
      } finally {
        result.unmount();
      }
    });
  }

  it('renders the error boundary of the parent layout when a layout fails to load', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const lazy = createLazyContext(
      {
        ...routes,
        './_layout.tsx': {
          default: () => <Stack />,
          ErrorBoundary: () => <Text testID="error">error</Text>,
        },
      },
      { rejectKeys: ['./(tabs)/anchored/_layout.tsx'] }
    );

    let result!: ReturnType<typeof render>;
    await act(async () => {
      result = render(<ExpoRoot context={lazy.context} location="/anchored/details" />);
    });
    try {
      await act(async () => {
        await lazy.load().catch(() => {});
      });

      // The failed load does not take the root down. It surfaces where the layout renders.
      expect(await screen.findByTestId('error')).toBeTruthy();
    } finally {
      result.unmount();
      consoleError.mockRestore();
    }
  });
});
