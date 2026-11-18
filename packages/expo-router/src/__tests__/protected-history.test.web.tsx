/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';
import { useState } from 'react';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';

it('pops the browser entry of a blocked active screen so one Back reaches Home', async () => {
  let close: () => void;
  const result = await renderRouter({
    _layout: function Layout() {
      const [open, setOpen] = useState(true);
      close = () => setOpen(false);
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={open}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => null,
    settings: () => null,
    login: () => null,
  });
  await act(() => router.push('/settings'));
  await act(() => router.push('/login'));
  const pushState = jest.spyOn(window.history, 'pushState');
  const go = jest.spyOn(window.history, 'go');

  try {
    await act(() => close());
    // The browser traversal runs after the history sync commits.
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/settings');
    expect(window.location.pathname).toBe('/settings');
    expect(go).toHaveBeenCalledWith(-1);
    expect(pushState).not.toHaveBeenCalled();

    // One browser Back reaches Home.
    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });
    expect(screen).toHavePathname('/');
    expect(window.location.pathname).toBe('/');
  } finally {
    await result.unmount();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});

it('replaces the browser entry of a blocked active screen with its explicit redirect', async () => {
  let close: () => void;
  const result = await renderRouter({
    _layout: function Layout() {
      const [open, setOpen] = useState(true);
      close = () => setOpen(false);
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={open} redirectTo="/">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => null,
    settings: () => null,
    login: () => null,
  });
  await act(() => router.push('/settings'));
  await act(() => router.push('/login'));
  const pushState = jest.spyOn(window.history, 'pushState');
  const go = jest.spyOn(window.history, 'go');

  try {
    await act(() => close());
    // The browser traversal runs after the history sync commits.
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/');
    expect(pushState).not.toHaveBeenCalled();
    expect(go).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/');
  } finally {
    await result.unmount();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});
