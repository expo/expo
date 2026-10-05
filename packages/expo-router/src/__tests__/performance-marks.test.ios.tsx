import { act, screen } from '@testing-library/react-native';
import { useLayoutEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import { internalNavigationEvents } from '../global-state/internalNavigationEvents';
import { Stack } from '../layouts/Stack';
import {
  unstable_enablePerformanceIntegration,
  unstable_performance,
  unstable_PerformanceObserver,
} from '../performance';
import type {
  RouterActionDispatchedMark,
  RouterPageFocusedMark,
  RouterPerformanceMark,
} from '../performance';
import { renderRouter } from '../testing-library';

describe('router performance marks', () => {
  const cleanups: (() => void)[] = [];

  beforeAll(() => {
    unstable_enablePerformanceIntegration();
  });

  afterEach(() => {
    while (cleanups.length) {
      cleanups.pop()!();
    }
    unstable_performance.clearMarks();
  });

  function observe(onEntry: (entry: RouterPerformanceMark) => void) {
    const observer = new unstable_PerformanceObserver((list) =>
      // Expo Router records only its own marks on native.
      list.getEntries().forEach((entry) => onEntry(entry as RouterPerformanceMark))
    );
    observer.observe({ type: 'mark' });
    cleanups.push(() => observer.disconnect());
  }

  function observePageFocused(onEntry?: (entry: RouterPageFocusedMark) => void) {
    const entries: RouterPageFocusedMark[] = [];
    observe((entry) => {
      if (entry.name === 'expo-router:page-focused') {
        entries.push(entry);
        onEntry?.(entry);
      }
    });
    return entries;
  }

  it('marks page-preloaded after the preloaded screen content has committed', async () => {
    const order: string[] = [];
    observe((entry) => {
      if (entry.name === 'expo-router:page-preloaded') order.push('pagePreloaded');
    });

    function DetailsScreen() {
      useLayoutEffect(() => {
        order.push('details-committed');
      });
      return <Text testID="details-content">Details</Text>;
    }

    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: DetailsScreen,
    });

    await act(() => router.prefetch('/details'));

    const preloadIdx = order.indexOf('pagePreloaded');
    const commitIdx = order.indexOf('details-committed');
    expect(commitIdx).toBeGreaterThanOrEqual(0);
    expect(preloadIdx).toBeGreaterThan(commitIdx);
  });

  it('marks page-focused after the focused screen content has committed', async () => {
    const order: string[] = [];
    observePageFocused(() => order.push('pageFocused'));

    function HomeScreen() {
      useLayoutEffect(() => {
        order.push('home-committed');
      });
      return <Text testID="home-content">Home</Text>;
    }

    await renderRouter({
      _layout: () => <Stack />,
      index: HomeScreen,
    });

    expect(screen.getByTestId('home-content')).toBeVisible();
    const focusIdx = order.indexOf('pageFocused');
    const commitIdx = order.indexOf('home-committed');
    expect(commitIdx).toBeGreaterThanOrEqual(0);
    expect(focusIdx).toBeGreaterThan(commitIdx);
  });

  it('does not mark page-focused again on plain re-renders of the focused screen', async () => {
    const entries = observePageFocused();

    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
    });

    expect(entries).toHaveLength(1);
    expect(entries.at(0)?.detail.pathname).toBe('/');

    // Force a re-render via a no-op setParams (same focused screen, fresh render pass)
    await act(() => router.setParams({ ping: '1' }));
    await act(() => router.setParams({ ping: '2' }));

    expect(entries).toHaveLength(1);
  });

  it('marks page-focused again when the screen is re-focused after a push/pop', async () => {
    const entries = observePageFocused();

    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: () => <Text testID="details-content">Details</Text>,
    });

    expect(entries).toHaveLength(1);
    expect(entries.at(0)?.detail.pathname).toBe('/');

    await act(() => router.push('/details'));
    expect(screen.getByTestId('details-content')).toBeVisible();
    expect(entries).toHaveLength(2);
    expect(entries.at(1)?.detail.pathname).toBe('/details');

    await act(() => router.back());
    expect(screen.getByTestId('home-content')).toBeVisible();
    expect(entries).toHaveLength(3);
    expect(entries.at(2)?.detail.pathname).toBe('/');
  });

  it('marks action-dispatched with the action type before the target page is focused', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: () => <Text testID="details-content">Details</Text>,
    });
    unstable_performance.clearMarks();

    await act(() => router.push('/details'));

    // Entries with these names are always the matching mark types.
    const [action] = unstable_performance.getEntriesByName(
      'expo-router:action-dispatched'
    ) as RouterActionDispatchedMark[];
    const [focus] = unstable_performance.getEntriesByName(
      'expo-router:page-focused'
    ) as RouterPageFocusedMark[];
    expect(action?.detail).toEqual({ actionType: 'PUSH' });
    expect(focus?.detail.pathname).toBe('/details');
    expect(focus!.startTime).toBeGreaterThanOrEqual(action!.startTime);
  });

  it('marks action-dispatched even when an internal listener throws', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    cleanups.push(
      internalNavigationEvents.addListener('actionDispatched', () => {
        throw new Error('listener failed');
      })
    );
    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: () => <Text testID="details-content">Details</Text>,
    });
    unstable_performance.clearMarks();

    await act(() => router.push('/details'));

    expect(
      unstable_performance
        .getEntriesByName('expo-router:action-dispatched')
        // Entries with this name are always action-dispatched marks.
        .map((entry) => (entry as RouterActionDispatchedMark).detail.actionType)
    ).toEqual(['PUSH']);
    warn.mockRestore();
  });
});
