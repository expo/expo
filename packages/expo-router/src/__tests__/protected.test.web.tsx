/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';

it('goes back to the accessible routes after a blocked route is removed and access returns', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  const result = await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={guard}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => null,
    settings: () => null,
    login: () => null,
  });

  try {
    await act(() => router.push('/settings'));
    await act(() => router.push('/login'));

    await act(() => setGuard(false));
    // The browser moves to the earlier entry with an asynchronous `history.go`.
    await act(() => jest.runAllTimersAsync());

    expect(screen).toHavePathname('/settings');
    expect(window.location.pathname).toBe('/settings');

    await act(() => setGuard(true));
    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/');
    expect(window.location.pathname).toBe('/');
    expect(router.canGoBack()).toBe(false);
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});

it('stays on the fallback when Back is pressed after every blocked route is replaced', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  const result = await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(false);
        setSignedIn = setState;
        return (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="login" />
              <Stack.Screen name="reset" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => null,
      login: () => null,
      reset: () => null,
    },
    { initialUrl: '/login' }
  );

  try {
    await act(() => router.push('/reset'));

    await act(() => setSignedIn(true));
    // The browser moves to the earlier entry with an asynchronous `history.go`.
    await act(() => jest.runAllTimersAsync());

    expect(screen).toHavePathname('/');
    expect(window.location.pathname).toBe('/');

    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/');
    expect(window.location.pathname).toBe('/');
    expect(router.canGoBack()).toBe(false);
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});
