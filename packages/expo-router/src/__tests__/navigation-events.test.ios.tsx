import { act, screen } from '@testing-library/react-native';
import { useLayoutEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import { Stack } from '../layouts/Stack';
import { unstable_navigationEvents } from '../navigationEvents';
import type {
  ActionDispatchedEvent,
  BasePageEvent,
  PageFocusedEvent,
} from '../navigationEvents/types';
import { renderRouter } from '../testing-library';

describe('AnalyticsListeners event timing', () => {
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

  it('continues delivering pageFocused when a listener throws during render', () => {
    const error = new Error('analytics failed');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    cleanups.push(() => warn.mockRestore());
    cleanups.push(
      unstable_navigationEvents.addListener('pageFocused', () => {
        throw error;
      })
    );
    const received = listenForPageFocused();

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
    });

    expect(screen.getByTestId('home-content')).toBeVisible();
    expect(received).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pageFocused'), error);
  });

  it('delivers the initial pageFocused to a root layout subscription', () => {
    const focused: BasePageEvent[] = [];

    function Layout() {
      useLayoutEffect(
        () => unstable_navigationEvents.addListener('pageFocused', (event) => focused.push(event)),
        []
      );
      return <Stack />;
    }

    renderRouter({
      _layout: Layout,
      index: () => <Text testID="home-content">Home</Text>,
    });

    expect(screen.getByTestId('home-content')).toBeVisible();
    expect(focused).toEqual([
      expect.objectContaining({
        pathname: '/',
        params: {},
        segments: [],
        screenId: expect.any(String),
      }),
    ]);
  });

  it('reports the previous screen when it blurs on push', () => {
    const blurred: BasePageEvent[] = [];
    cleanups.push(
      unstable_navigationEvents.addListener('pageBlurred', (event) => blurred.push(event))
    );
    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text>Home</Text>,
      details: () => <Text>Details</Text>,
    });
    act(() => router.push('/details'));
    expect(blurred).toEqual([
      expect.objectContaining({
        pathname: '/',
        params: {},
        segments: [],
        screenId: expect.any(String),
      }),
    ]);
  });

  it('reports removal on pop and route-info changes', () => {
    const removed: BasePageEvent[] = [];
    cleanups.push(
      unstable_navigationEvents.addListener('pageRemoved', (event) => removed.push(event))
    );
    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text>Home</Text>,
      details: () => <Text>Details</Text>,
    });
    act(() => router.push('/details'));
    act(() => router.setParams({ ping: '1' }));
    expect(removed).toContainEqual(
      expect.objectContaining({
        pathname: '/details',
        params: {},
        segments: ['details'],
        screenId: expect.any(String),
      })
    );
    act(() => router.back());
    expect(removed).toContainEqual(
      expect.objectContaining({
        pathname: '/details',
        params: { ping: '1' },
        segments: ['details'],
        screenId: expect.any(String),
      })
    );
  });

  it('reports focus and action events for a push', () => {
    const actions: Omit<ActionDispatchedEvent, 'type'>[] = [];
    const focused = listenForPageFocused();
    cleanups.push(
      unstable_navigationEvents.addListener('actionDispatched', (event) => actions.push(event))
    );
    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text>Home</Text>,
      details: () => <Text>Details</Text>,
    });
    act(() => router.push('/details'));
    expect(focused).toContainEqual(
      expect.objectContaining({
        pathname: '/details',
        params: {},
        segments: ['details'],
        screenId: expect.any(String),
      })
    );
    expect(actions).toContainEqual(
      expect.objectContaining({
        actionType: 'PUSH',
        payload: expect.objectContaining({ name: 'details' }),
        state: expect.objectContaining({ routes: expect.any(Array) }),
      })
    );
  });

  it('emits pagePreloaded after the preloaded screen content has committed', () => {
    const order: string[] = [];
    const cleanup = unstable_navigationEvents.addListener('pagePreloaded', () =>
      order.push('pagePreloaded')
    );
    cleanups.push(cleanup);

    function DetailsScreen() {
      useLayoutEffect(() => {
        order.push('details-committed');
      });
      return <Text testID="details-content">Details</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="home-content">Home</Text>,
      details: DetailsScreen,
    });

    act(() => router.prefetch('/details'));

    const preloadIdx = order.indexOf('pagePreloaded');
    const commitIdx = order.indexOf('details-committed');
    expect(commitIdx).toBeGreaterThanOrEqual(0);
    expect(preloadIdx).toBeGreaterThan(commitIdx);
  });

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
