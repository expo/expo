import { act, screen } from '@testing-library/react-native';
import { useLayoutEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import { Stack } from '../layouts/Stack';
import { unstable_navigationEvents } from '../navigationEvents';
import type { PageFocusedEvent } from '../navigationEvents/types';
import { renderRouter } from '../testing-library';

describe('AnalyticsListeners pageFocused timing', () => {
  const cleanups: (() => void)[] = [];

  beforeAll(() => {
    unstable_navigationEvents.enable();
  });

  afterEach(() => {
    while (cleanups.length) {
      cleanups.pop()!();
    }
  });

  function listenForPageFocused(onEvent?: (event: PageFocusedEvent) => void) {
    const events: PageFocusedEvent[] = [];
    const cleanup = unstable_navigationEvents.addListener('pageFocused', (payload) => {
      const event: PageFocusedEvent = { type: 'pageFocused', ...payload };
      events.push(event);
      onEvent?.(event);
    });
    cleanups.push(cleanup);
    return events;
  }

  it('emits pageFocused after the focused screen content has committed', () => {
    const order: string[] = [];
    listenForPageFocused(() => order.push('pageFocused'));

    function HomeScreen() {
      useLayoutEffect(() => {
        order.push('home-committed');
      });
      return <Text testID="home-content">Home</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: HomeScreen,
    });

    expect(screen.getByTestId('home-content')).toBeVisible();
    const focusIdx = order.indexOf('pageFocused');
    const commitIdx = order.indexOf('home-committed');
    expect(commitIdx).toBeGreaterThanOrEqual(0);
    expect(focusIdx).toBeGreaterThan(commitIdx);
  });

  it('does not re-emit pageFocused on plain re-renders of the focused screen', () => {
    const events = listenForPageFocused();

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
    });

    expect(events).toHaveLength(1);
    expect(events.at(0)?.pathname).toBe('/');

    // Force a re-render via a no-op setParams (same focused screen, fresh render pass)
    act(() => router.setParams({ ping: '1' }));
    act(() => router.setParams({ ping: '2' }));

    expect(events).toHaveLength(1);
  });

  it('re-emits pageFocused when the screen is re-focused after a push/pop', () => {
    const events = listenForPageFocused();

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: () => <Text testID="details-content">Details</Text>,
    });

    expect(events).toHaveLength(1);
    expect(events.at(0)?.pathname).toBe('/');

    act(() => router.push('/details'));
    expect(screen.getByTestId('details-content')).toBeVisible();
    expect(events).toHaveLength(2);
    expect(events.at(1)?.pathname).toBe('/details');

    act(() => router.back());
    expect(screen.getByTestId('home-content')).toBeVisible();
    expect(events).toHaveLength(3);
    expect(events.at(2)?.pathname).toBe('/');
  });
});
