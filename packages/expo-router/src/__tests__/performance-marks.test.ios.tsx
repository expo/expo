import { act, screen } from '@testing-library/react-native';
import { useLayoutEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import { internalNavigationEvents } from '../global-state/internalNavigationEvents';
import { Stack } from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
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

  function observePreloadAndFocus(pathname: string) {
    const entries: { name: string; screenId: string }[] = [];
    observe((entry) => {
      if (
        (entry.name === 'expo-router:page-preloaded' ||
          entry.name === 'expo-router:page-focused') &&
        entry.detail.pathname === pathname
      ) {
        entries.push({ name: entry.name, screenId: entry.detail.screenId });
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

    expect(order).toEqual(['details-committed', 'pagePreloaded']);
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
    expect(order).toEqual(['home-committed', 'pageFocused']);
  });

  it('does not mark a first push into a nested stack as a preload', async () => {
    const entries = observePreloadAndFocus('/examples/nested-stack/heavy');

    await renderRouter(
      {
        _layout: () => <Stack />,
        'examples/nested-stack/_layout': () => <Stack />,
        'examples/nested-stack/index': () => <Text>Nested stack</Text>,
        'examples/nested-stack/heavy': () => <Text testID="heavy-content">Heavy</Text>,
      },
      { initialUrl: '/examples/nested-stack' }
    );

    await act(() => router.push('/examples/nested-stack/heavy'));

    expect(screen.getByTestId('heavy-content')).toBeVisible();
    expect(entries.map((entry) => entry.name)).toEqual(['expo-router:page-focused']);
  });

  it('marks a prefetch into an unmounted nested stack as a preload, then focuses it on push', async () => {
    const entries = observePreloadAndFocus('/nested/heavy');

    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      'nested/_layout': () => <Stack />,
      'nested/heavy': () => <Text testID="heavy-content">Heavy</Text>,
    });

    await act(() => router.prefetch('/nested/heavy'));
    expect(screen).toHavePathname('/');
    expect(entries.map((entry) => entry.name)).toEqual(['expo-router:page-preloaded']);

    await act(() => router.push('/nested/heavy'));
    expect(screen.getByTestId('heavy-content')).toBeVisible();
    expect(entries.map((entry) => entry.name)).toEqual([
      'expo-router:page-preloaded',
      'expo-router:page-focused',
    ]);
    expect(entries.at(1)?.screenId).toBe(entries.at(0)?.screenId);
  });

  it('marks an eagerly mounted inactive tab as a preload, then focuses it on activation', async () => {
    const entries = observePreloadAndFocus('/other');

    await renderRouter({
      _layout: () => (
        <Tabs screenOptions={{ lazy: false }}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="other" />
        </Tabs>
      ),
      index: () => <Text testID="home-content">Home</Text>,
      other: () => <Text testID="other-content">Other</Text>,
    });

    expect(entries.map((entry) => entry.name)).toEqual(['expo-router:page-preloaded']);

    await act(() => router.navigate('/other'));
    expect(screen.getByTestId('other-content')).toBeVisible();
    expect(entries.map((entry) => entry.name)).toEqual([
      'expo-router:page-preloaded',
      'expo-router:page-focused',
    ]);
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
    const preloaded: string[] = [];
    observe((entry) => {
      if (entry.name === 'expo-router:page-preloaded') preloaded.push(entry.detail.pathname);
    });

    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: () => <Text testID="details-content">Details</Text>,
    });

    expect(entries.map((entry) => entry.detail.pathname)).toEqual(['/']);

    entries.splice(0);
    await act(() => router.push('/details'));
    expect(screen.getByTestId('details-content')).toBeVisible();
    expect(entries.map((entry) => entry.detail.pathname)).toEqual(['/details']);

    entries.splice(0);
    await act(() => router.back());
    expect(screen.getByTestId('home-content')).toBeVisible();
    expect(entries.map((entry) => entry.detail.pathname)).toEqual(['/']);
    // Neither navigation is a preload.
    expect(preloaded).toEqual([]);
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
