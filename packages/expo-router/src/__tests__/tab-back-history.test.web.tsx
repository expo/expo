/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';

import { router } from '../imperative-api';
import Tabs from '../layouts/Tabs';
import { renderRouter, screen } from '../testing-library';

it('replaces the browser entry when Back leaves a pushed tab for the first tab', async () => {
  const pushState = jest.spyOn(window.history, 'pushState');
  const replaceState = jest.spyOn(window.history, 'replaceState');
  const go = jest.spyOn(window.history, 'go');
  const result = await renderRouter({
    index: () => null,
    'tabs/_layout': () => (
      <Tabs
        backBehavior="firstRoute"
        screenOptions={{ headerShown: false, tabBarButton: () => null }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    'tabs/index': () => null,
    'tabs/second': () => null,
  });

  try {
    await act(() => router.push('/tabs/second'));
    await act(async () => {
      router.back();
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/tabs');
    expect(pushState.mock.calls.map(([, , path]) => path)).toEqual(['/tabs/second']);
    expect(go).not.toHaveBeenCalled();
    // The tabs write their back history once after mounting, which refreshes the current entry.
    expect(replaceState.mock.calls.map(([, , path]) => path)).toEqual([
      '/',
      '/tabs/second',
      '/tabs',
    ]);
  } finally {
    await result.unmount();
    jest.useRealTimers();
    pushState.mockRestore();
    replaceState.mockRestore();
    go.mockRestore();
  }
});
